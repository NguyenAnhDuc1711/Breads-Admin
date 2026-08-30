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
    data: posts,
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

  // BE trả về mảng post cho trang hiện tại, KHÔNG kèm tổng số bản ghi -> ước lượng
  // totalPages: còn nguyên 1 trang đầy => có thể còn trang kế tiếp.
  const totalPages =
    (posts?.length ?? 0) === ROWS_PER_PAGE ? currentPage + 1 : currentPage;

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
        data={posts ?? []}
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
