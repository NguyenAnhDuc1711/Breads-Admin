import { useMemo, useState } from "react";
import { Constants } from "@/Breads-Shared/Constants";
import type { IPost } from "@/Breads-Shared/Types";
import SearchableTable, {
  type SearchableTableColumn,
} from "@/components/SearchableTable";
import useDebounce from "@/hooks/useDebounce";
import { useGetPostsQuery, useUpdatePostStatusMutation } from "@/store/api/postApi";
import {
  useGetCurrentUserQuery,
  useGetUsersPendingPostQuery,
  type UserShortInfo,
} from "@/store/api/userApi";

const ROWS_PER_PAGE = 10;
const FILTER_PAGE = "admin/posts/validation";

const PostsValidationPage = () => {
  const { data: currentUser } = useGetCurrentUserQuery();

  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [authorFilter, setAuthorFilter] = useState<string | undefined>(undefined);
  const [selectedAuthorLabel, setSelectedAuthorLabel] = useState("");
  const [authorSearchTerm, setAuthorSearchTerm] = useState("");
  const debouncedAuthorSearchTerm = useDebounce(authorSearchTerm);

  const { data: authorResults, isFetching: isSearchingAuthors } =
    useGetUsersPendingPostQuery(
      { page: 1, limit: 10, searchValue: debouncedAuthorSearchTerm },
      { skip: !debouncedAuthorSearchTerm },
    );

  const {
    data: result,
    isFetching,
    isError,
  } = useGetPostsQuery(
    {
      userId: currentUser?._id ?? "",
      filterPage: FILTER_PAGE,
      user: authorFilter,
      page: currentPage,
      limit: ROWS_PER_PAGE,
    },
    { skip: !currentUser },
  );
  const posts = result?.data;

  const [updatePostStatus] = useUpdatePostStatusMutation();

  const handleSelectAuthor = (user: UserShortInfo) => {
    setAuthorFilter(user._id);
    setSelectedAuthorLabel(user.username);
    setAuthorSearchTerm("");
    setCurrentPage(1);
  };

  const handleClearAuthorFilter = () => {
    setAuthorFilter(undefined);
    setSelectedAuthorLabel("");
    setAuthorSearchTerm("");
    setCurrentPage(1);
  };

  const handleUpdateStatus = (postId: string | undefined, status: number) => {
    if (!currentUser || !postId) return;
    updatePostStatus({ postId, userId: currentUser._id, status });
  };

  // Không có search full-text ở tầng BE cho post — lọc phía client trên ĐÚNG trang đang
  // tải theo content (ô search này khác `authorSearchTerm`, vốn dùng cho typeahead chọn
  // tác giả ở trên), để ô search không rơi vào tình trạng "hiện diện nhưng vô tác dụng".
  const filteredPosts = useMemo(() => {
    const list = posts ?? [];
    const term = searchValue.trim().toLowerCase();
    if (!term) return list;
    return list.filter((post) => post.content?.toLowerCase().includes(term));
  }, [posts, searchValue]);

  const columns: SearchableTableColumn<IPost>[] = useMemo(
    () => [
      {
        key: "author",
        header: "Author",
        render: (post) => (
          <div className="d-flex align-items-center gap-2">
            {post.authorInfo?.avatar && (
              <img
                src={post.authorInfo.avatar}
                alt={post.authorInfo.username}
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <span>@{post.authorInfo?.username ?? "unknown"}</span>
          </div>
        ),
      },
      {
        key: "content",
        header: "Content",
        render: (post) => (
          <span className="text-muted small">
            {post.content.length > 120
              ? `${post.content.slice(0, 120)}...`
              : post.content}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Created At",
        render: (post) =>
          post.createdAt ? new Date(post.createdAt).toLocaleString() : "—",
      },
      {
        key: "actions",
        header: "Action",
        cellStyle: { textAlign: "right", whiteSpace: "nowrap" },
        render: (post) => (
          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={() => handleUpdateStatus(post._id, Constants.POST_STATUS.PUBLIC)}
            >
              Mark Reviewed
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleUpdateStatus(post._id, Constants.POST_STATUS.DELETED)}
            >
              Take Down
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser],
  );

  // Bug fix: trước đây ước lượng totalPages từng nấc một (currentPage+1 khi trang đầy) khiến
  // pagination chỉ hiện thêm trang mỗi lần bấm next. Giờ BE trả totalCount thật.
  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / ROWS_PER_PAGE));

  return (
    <div className="container-fluid py-3">
      <div className="mb-3">
        <h1 className="h4 mb-1">Posts Validation</h1>
        <p className="text-muted small mb-0">
          Review queue for posts pending validation, oldest first.
        </p>
      </div>

      <div className="mb-3" style={{ maxWidth: 320, position: "relative" }}>
        <label className="form-label small text-muted mb-1">Filter by author</label>
        {authorFilter ? (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border px-2 py-2">
              @{selectedAuthorLabel}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleClearAuthorFilter}
            >
              Clear
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search author by username..."
            value={authorSearchTerm}
            onChange={(e) => setAuthorSearchTerm(e.target.value)}
          />
        )}

        {!authorFilter && debouncedAuthorSearchTerm && (
          <div
            className="dropdown-menu show w-100"
            style={{ maxHeight: 220, overflowY: "auto" }}
          >
            {isSearchingAuthors ? (
              <span className="dropdown-item-text text-muted small">Searching...</span>
            ) : authorResults && authorResults.length > 0 ? (
              authorResults.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => handleSelectAuthor(user)}
                >
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }}
                    />
                  )}
                  <span>@{user.username}</span>
                </button>
              ))
            ) : (
              <span className="dropdown-item-text text-muted small">
                No matching users
              </span>
            )}
          </div>
        )}
      </div>

      <SearchableTable
        columns={columns}
        data={filteredPosts}
        rowKey={(post) => post._id!}
        loading={isFetching}
        error={
          isError ? "Could not load the validation queue. Please try again." : undefined
        }
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        emptyMessage="No posts pending validation."
      />
    </div>
  );
};

export default PostsValidationPage;
