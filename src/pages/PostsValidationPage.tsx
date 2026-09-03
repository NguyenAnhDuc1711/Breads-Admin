import { useMemo, useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  FiEye,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiUser,
  FiFileText,
  FiImage,
  FiVideo,
  FiBarChart2,
  FiRotateCcw,
  FiClock,
} from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IPost } from "@/Breads-Shared/Types";
import PaginationBtn from "@/components/PaginationBtn";
import PostDetailModal from "@/components/PostDetailModal";
import useDebounce from "@/hooks/useDebounce";
import { useGetPostsQuery, useUpdatePostStatusMutation } from "@/store/api/postApi";
import {
  useGetCurrentUserQuery,
  useGetUsersPendingPostQuery,
  type UserShortInfo,
} from "@/store/api/userApi";
import "./PostsPage.css";

const ROWS_PER_PAGE = 10;
const FILTER_PAGE = "admin/posts/validation";

const PostsValidationPage = () => {
  const { data: currentUser } = useGetCurrentUserQuery();

  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [authorFilter, setAuthorFilter] = useState<string | undefined>(undefined);
  const [selectedAuthor, setSelectedAuthor] = useState<UserShortInfo | null>(null);
  const [authorSearchTerm, setAuthorSearchTerm] = useState("");
  const debouncedAuthorSearchTerm = useDebounce(authorSearchTerm);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  const { data: authorResults, isFetching: isSearchingAuthors } =
    useGetUsersPendingPostQuery(
      { page: 1, limit: 10, searchValue: debouncedAuthorSearchTerm },
      { skip: !debouncedAuthorSearchTerm },
    );

  const {
    data: result,
    isFetching,
    refetch,
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

  // Click outside for author search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        authorDropdownRef.current &&
        !authorDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAuthorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedAuthorSearchTerm) {
      setIsAuthorDropdownOpen(true);
    }
  }, [debouncedAuthorSearchTerm]);

  const handleSelectAuthor = (user: UserShortInfo) => {
    setAuthorFilter(user._id);
    setSelectedAuthor(user);
    setAuthorSearchTerm("");
    setIsAuthorDropdownOpen(false);
    setCurrentPage(1);
  };

  const handleClearAuthorFilter = () => {
    setAuthorFilter(undefined);
    setSelectedAuthor(null);
    setAuthorSearchTerm("");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchValue("");
    handleClearAuthorFilter();
  };

  const handleUpdateStatus = (postId: string | undefined, status: number) => {
    if (!currentUser || !postId) return;
    updatePostStatus({ postId, status });
  };

  const handlePageChange: Dispatch<SetStateAction<number>> = (value) => {
    setCurrentPage(value);
  };

  const hasActiveFilters = Boolean(searchValue) || Boolean(authorFilter);

  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  const currentRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const currentRangeEnd = Math.min(currentPage * ROWS_PER_PAGE, totalCount);

  // Client-side search on currently loaded batch
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

  return (
    <div className="posts-page">
      {/* Header */}
      <div className="posts-page__header">
        <div>
          <div className="posts-page__header-left">
            <h1 className="posts-page__title">Posts Validation</h1>
            <span className="posts-page__badge-queue">
              {totalCount.toLocaleString()} pending queue
            </span>
          </div>
          <p className="posts-page__subtitle">
            Moderation review queue for pending community posts, ordered oldest first
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-2 py-1"
            style={{ height: "34px", fontSize: "0.8rem" }}
            onClick={() => refetch()}
            title="Refresh validation queue"
          >
            <FiRefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="posts-page__filter-card">
        <div className="posts-page__filters-row">
          {/* Content Search */}
          <div className="posts-page__search-wrap">
            <span className="posts-page__search-icon">
              <FiSearch size={14} />
            </span>
            <input
              type="text"
              className="form-control posts-page__search-input"
              placeholder="Search content or author in queue..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <button
                type="button"
                className="posts-page__search-clear"
                onClick={() => setSearchValue("")}
                title="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Author Typeahead Filter */}
          <div className="posts-page__author-filter" ref={authorDropdownRef}>
            {selectedAuthor ? (
              <div className="posts-page__author-pill">
                <FiUser size={12} />
                <span>@{selectedAuthor.username}</span>
                <button
                  type="button"
                  className="posts-page__author-clear"
                  onClick={handleClearAuthorFilter}
                  title="Remove author filter"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <span className="posts-page__search-icon">
                  <FiUser size={13} />
                </span>
                <input
                  type="text"
                  className="form-control posts-page__search-input"
                  style={{ width: "200px" }}
                  placeholder="Filter author..."
                  value={authorSearchTerm}
                  onFocus={() => {
                    if (debouncedAuthorSearchTerm) setIsAuthorDropdownOpen(true);
                  }}
                  onChange={(e) => setAuthorSearchTerm(e.target.value)}
                />
                {authorSearchTerm && (
                  <button
                    type="button"
                    className="posts-page__search-clear"
                    onClick={() => setAuthorSearchTerm("")}
                    title="Clear search"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Floating Autocomplete Dropdown */}
            {!selectedAuthor && isAuthorDropdownOpen && debouncedAuthorSearchTerm && (
              <div className="posts-page__author-dropdown">
                {isSearchingAuthors ? (
                  <div className="text-center py-2 text-muted small">
                    Searching authors...
                  </div>
                ) : authorResults && authorResults.length > 0 ? (
                  authorResults.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      className="posts-page__author-item"
                      onClick={() => handleSelectAuthor(user)}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {(user.username || "U").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>@{user.username}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted small">
                    No matching authors
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset Button */}
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
      </div>

      {/* Data Table Card (Full height flex child) */}
      <div className="posts-page__table-card">
        <div className="posts-page__table-wrap">
          <table className="posts-page__table">
            <thead>
              <tr>
                <th style={{ width: "200px" }}>Author</th>
                <th>Content & Attachments</th>
                <th style={{ width: "170px" }}>Created At</th>
                <th style={{ width: "240px", textAlign: "right" }}>Moderation Action</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                // Skeletons
                Array.from({ length: ROWS_PER_PAGE }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="posts-page__skeleton"
                          style={{ width: "34px", height: "34px", borderRadius: "8px" }}
                        />
                        <div className="d-flex flex-column gap-1" style={{ width: "110px" }}>
                          <div
                            className="posts-page__skeleton"
                            style={{ height: "12px", width: "100%" }}
                          />
                          <div
                            className="posts-page__skeleton"
                            style={{ height: "10px", width: "60%" }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <div
                          className="posts-page__skeleton"
                          style={{ height: "13px", width: "85%" }}
                        />
                        <div
                          className="posts-page__skeleton"
                          style={{ height: "11px", width: "40%" }}
                        />
                      </div>
                    </td>
                    <td>
                      <div
                        className="posts-page__skeleton"
                        style={{ height: "13px", width: "120px" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        className="posts-page__skeleton"
                        style={{
                          height: "28px",
                          width: "200px",
                          marginLeft: "auto",
                          borderRadius: "6px",
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post: IPost) => {
                  const media = post.media ?? [];
                  const survey = post.survey ?? [];
                  const hasImage = media.some((m) => m.type === Constants.MEDIA_TYPE.IMAGE);
                  const hasVideo = media.some((m) => m.type === Constants.MEDIA_TYPE.VIDEO);
                  const hasGif = media.some((m) => m.type === Constants.MEDIA_TYPE.GIF);
                  const hasSurvey = survey.length > 0;

                  return (
                    <tr
                      key={post._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedPost(post)}
                    >
                      {/* Author */}
                      <td>
                        <div className="posts-page__author-cell">
                          <div className="posts-page__avatar-wrap">
                            {post.authorInfo?.avatar ? (
                              <img
                                src={post.authorInfo.avatar}
                                alt={post.authorInfo.username}
                                className="posts-page__avatar"
                              />
                            ) : (
                              <div className="posts-page__avatar-fallback">
                                {(post.authorInfo?.username || "U").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="posts-page__author-info">
                            <span
                              className="posts-page__author-name"
                              title={post.authorInfo?.name}
                            >
                              {post.authorInfo?.name || "Unknown"}
                            </span>
                            <span className="posts-page__author-username">
                              @{post.authorInfo?.username || "unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Content & Media Tags */}
                      <td>
                        <div className="posts-page__content-wrap">
                          <span
                            className="posts-page__content-text"
                            title={post.content}
                          >
                            {post.content || "(No text content)"}
                          </span>

                          {(hasImage || hasVideo || hasGif || hasSurvey) && (
                            <div className="posts-page__media-tags">
                              {hasImage && (
                                <span className="posts-page__media-pill">
                                  <FiImage size={10} /> Image
                                </span>
                              )}
                              {hasVideo && (
                                <span className="posts-page__media-pill">
                                  <FiVideo size={10} /> Video
                                </span>
                              )}
                              {hasGif && (
                                <span className="posts-page__media-pill">
                                  <FiFileText size={10} /> GIF
                                </span>
                              )}
                              {hasSurvey && (
                                <span className="posts-page__media-pill">
                                  <FiBarChart2 size={10} /> Poll ({survey.length})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td>
                        <span className="text-muted small d-inline-flex align-items-center gap-1">
                          <FiClock size={11} className="text-muted" />
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
                      </td>

                      {/* Moderation Actions */}
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div className="posts-page__action-group">
                          <button
                            type="button"
                            className="posts-page__btn-view"
                            onClick={() => setSelectedPost(post)}
                            title="View full post details"
                          >
                            <FiEye size={12} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="posts-page__btn-approve"
                            onClick={() =>
                              handleUpdateStatus(post._id, Constants.POST_STATUS.PUBLIC)
                            }
                            title="Approve post to public feed"
                          >
                            <FiCheck size={12} />
                            <span>Mark Reviewed</span>
                          </button>

                          <button
                            type="button"
                            className="posts-page__btn-takedown"
                            onClick={() =>
                              handleUpdateStatus(post._id, Constants.POST_STATUS.DELETED)
                            }
                            title="Take down post"
                          >
                            <FiTrash2 size={12} />
                            <span>Take Down</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Empty State
                <tr>
                  <td colSpan={4}>
                    <div className="posts-page__empty">
                      <div className="posts-page__empty-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <FiCheck size={22} />
                      </div>
                      <div className="posts-page__empty-title">
                        All clear! No posts pending validation
                      </div>
                      <div className="posts-page__empty-desc">
                        {hasActiveFilters
                          ? "No posts in the validation queue match your filter criteria."
                          : "Great job! All submitted posts have been reviewed and validated."}
                      </div>
                      {hasActiveFilters && (
                        <button
                          className="btn btn-outline-dark btn-sm px-3"
                          onClick={handleResetFilters}
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="posts-page__table-footer">
          <div className="posts-page__footer-info">
            {totalCount > 0 ? (
              <>
                Showing <strong className="text-dark">{currentRangeStart}</strong> to{" "}
                <strong className="text-dark">{currentRangeEnd}</strong> of{" "}
                <strong className="text-dark">{totalCount.toLocaleString()}</strong> posts in queue
              </>
            ) : (
              "0 posts in queue"
            )}
          </div>

          <PaginationBtn
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
          />
        </div>
      </div>

      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
};

export default PostsValidationPage;
