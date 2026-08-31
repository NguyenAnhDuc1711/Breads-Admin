import { useMemo, useState } from "react";
import { FiRotateCcw } from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IPost } from "@/Breads-Shared/Types";
import CustomDropdown, { type DropdownOption } from "@/components/CustomDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import SearchableTable, {
  type SearchableTableColumn,
} from "@/components/SearchableTable";
import {
  useGetPostsQuery,
  useUpdatePostStatusMutation,
} from "@/store/api/postApi";
import { useGetCurrentUserQuery } from "@/store/api/userApi";

const ROWS_PER_PAGE = 10;
const FILTER_PAGE = "admin/posts";

const POST_STATUS_THEME: Record<number, { label: string; dot: string }> = {
  [Constants.POST_STATUS.PRE_ACCEPT]: { label: "Pending", dot: "#f59e0b" },
  [Constants.POST_STATUS.PUBLIC]: { label: "Public", dot: "#22c55e" },
  [Constants.POST_STATUS.DELETED]: { label: "Deleted", dot: "#ef4444" },
};

const contentTypeOptions: DropdownOption<string>[] = [
  { value: "", label: "All Content" },
  { value: "text", label: "Text" },
  { value: "gif", label: "GIF" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "survey", label: "Survey" },
];

const postTypeOptions: DropdownOption<string>[] = [
  { value: "", label: "All Types" },
  { value: "create", label: "Create" },
  { value: "reply", label: "Reply" },
  { value: "repost", label: "Repost" },
];

const postStatusOptions: DropdownOption<number>[] = [
  Constants.POST_STATUS.PRE_ACCEPT,
  Constants.POST_STATUS.PUBLIC,
  Constants.POST_STATUS.DELETED,
].map((value) => ({
  value,
  label: POST_STATUS_THEME[value].label,
  dotColor: POST_STATUS_THEME[value].dot,
}));

const PostsPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: currentUser } = useGetCurrentUserQuery();
  const {
    data: result,
    isFetching,
    isError,
  } = useGetPostsQuery(
    {
      userId: currentUser?._id ?? "",
      filterPage: FILTER_PAGE,
      postContent: contentTypeFilter ? [contentTypeFilter] : undefined,
      postType: postTypeFilter ? [postTypeFilter] : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: currentPage,
      limit: ROWS_PER_PAGE,
    },
    { skip: !currentUser },
  );
  const posts = result?.data;
  const [updatePostStatus] = useUpdatePostStatusMutation();

  const hasActiveFilters =
    Boolean(searchValue) ||
    contentTypeFilter !== "" ||
    postTypeFilter !== "" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const handleResetFilters = () => {
    setSearchValue("");
    setContentTypeFilter("");
    setPostTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const resetToFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setCurrentPage(1);
    };

  // Bug fix: trước đây ước lượng totalPages = currentPage+1 khi trang đầy — khiến pagination
  // chỉ hiện thêm từng trang một mỗi lần bấm next thay vì đúng tổng ngay từ đầu. Giờ BE trả
  // totalCount thật (post.controller.ts getPosts, chỉ cho 2 trang admin).
  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / ROWS_PER_PAGE));

  // Không có search full-text ở tầng BE cho post (khác users) — lọc phía client trên
  // ĐÚNG trang đang tải (không phải toàn bộ dataset) theo content + username/name tác giả,
  // để ô search không rơi vào tình trạng "hiện diện nhưng vô tác dụng" (phát hiện lúc verify).
  const filteredPosts = useMemo(() => {
    const list = posts ?? [];
    const term = searchValue.trim().toLowerCase();
    if (!term) return list;
    return list.filter((post) => {
      const haystacks = [
        post.content,
        post.authorInfo?.username,
        post.authorInfo?.name,
      ];
      return haystacks.some((v) => v?.toLowerCase().includes(term));
    });
  }, [posts, searchValue]);

  const columns: SearchableTableColumn<IPost>[] = useMemo(
    () => [
      {
        key: "author",
        header: "Author",
        render: (post) => (
          <div className="d-flex align-items-center gap-2">
            {post.authorInfo?.avatar ? (
              <img
                src={post.authorInfo.avatar}
                alt={post.authorInfo.username}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                {(post.authorInfo?.username || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="d-flex flex-column">
              <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                {post.authorInfo?.name || "Unknown"}
              </span>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                @{post.authorInfo?.username || "unknown"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "content",
        header: "Content",
        render: (post) => {
          const snippet = post.content?.slice(0, 80) ?? "";
          return (
            <span title={post.content}>
              {snippet}
              {post.content && post.content.length > 80 ? "…" : ""}
            </span>
          );
        },
        cellStyle: { maxWidth: 320 },
      },
      {
        key: "type",
        header: "Type",
        render: (post) => (
          <span className="text-capitalize">{post.type || "create"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (post) => (
          <CustomDropdown<number>
            value={post.status ?? Constants.POST_STATUS.PRE_ACCEPT}
            options={postStatusOptions}
            onChange={(newStatus) => {
              if (!post._id || !currentUser?._id) return;
              updatePostStatus({
                postId: post._id,
                userId: currentUser._id,
                status: newStatus,
              });
            }}
            size="sm"
            minWidth="140px"
          />
        ),
      },
      {
        key: "createdAt",
        header: "Created At",
        render: (post) => (
          <span className="text-muted small">
            {post.createdAt
              ? new Date(post.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        ),
      },
    ],
    [currentUser, updatePostStatus],
  );

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">Post Management</h1>
          <p className="text-muted small mb-0">
            Review posts, filter by content/type, and moderate status.
          </p>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <CustomDropdown
          value={contentTypeFilter}
          options={contentTypeOptions}
          onChange={resetToFirstPage(setContentTypeFilter)}
          placeholder="All Content"
          minWidth="140px"
        />
        <CustomDropdown
          value={postTypeFilter}
          options={postTypeOptions}
          onChange={resetToFirstPage(setPostTypeFilter)}
          placeholder="All Types"
          minWidth="130px"
        />
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
            setCurrentPage(1);
          }}
          onClear={() => {
            setDateFrom("");
            setDateTo("");
            setCurrentPage(1);
          }}
        />
        {hasActiveFilters && (
          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-2"
            style={{ height: "36px", fontSize: "0.8rem" }}
            onClick={handleResetFilters}
            title="Reset all filters"
          >
            <FiRotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <SearchableTable
        columns={columns}
        data={filteredPosts}
        rowKey={(p) => p._id!}
        loading={isFetching}
        error={
          isError ? "Không tải được danh sách bài viết. Thử lại." : undefined
        }
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        emptyMessage="Không có bài viết nào khớp bộ lọc."
      />
    </div>
  );
};

export default PostsPage;
