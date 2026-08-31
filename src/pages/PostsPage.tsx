import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiImage,
  FiVideo,
  FiBarChart2,
  FiFileText,
  FiMessageSquare,
  FiRepeat,
  FiEdit3,
} from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IPost } from "@/Breads-Shared/Types";
import CustomDropdown, { type DropdownOption } from "@/components/CustomDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import PaginationBtn from "@/components/PaginationBtn";
import PostDetailModal from "@/components/PostDetailModal";
import {
  useGetPostsQuery,
  useUpdatePostStatusMutation,
} from "@/store/api/postApi";
import { useGetCurrentUserQuery } from "@/store/api/userApi";
import "./PostsPage.css";

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

const PostTypeBadge = ({ type }: { type?: string }) => {
  const t = type?.toLowerCase() || "create";
  if (t === "reply") {
    return (
      <span className="posts-page__type-badge posts-page__type-badge--reply">
        <FiMessageSquare size={11} /> Reply
      </span>
    );
  }
  if (t === "repost") {
    return (
      <span className="posts-page__type-badge posts-page__type-badge--repost">
        <FiRepeat size={11} /> Repost
      </span>
    );
  }
  return (
    <span className="posts-page__type-badge posts-page__type-badge--create">
      <FiEdit3 size={11} /> Create
    </span>
  );
};

const PostsPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  const { data: currentUser } = useGetCurrentUserQuery();
  const {
    data: result,
    isFetching,
    refetch,
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

  const handlePageChange: Dispatch<SetStateAction<number>> = (value) => {
    setCurrentPage(value);
  };

  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  const currentRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const currentRangeEnd = Math.min(currentPage * ROWS_PER_PAGE, totalCount);

  // Client-side search for currently loaded posts
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
            <h1 className="posts-page__title">Post Management</h1>
            <span className="posts-page__badge-count">
              {totalCount.toLocaleString()} posts
            </span>
          </div>
          <p className="posts-page__subtitle">
            Review community posts, filter by media/type, and manage moderation status
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-2 py-1"
            style={{ height: "34px", fontSize: "0.8rem" }}
            onClick={() => refetch()}
            title="Refresh post list"
          >
            <FiRefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="posts-page__filter-card">
        <div className="posts-page__filters-row">
          {/* Search Input */}
          <div className="posts-page__search-wrap">
            <span className="posts-page__search-icon">
              <FiSearch size={14} />
            </span>
            <input
              type="text"
              className="form-control posts-page__search-input"
              placeholder="Search content or author..."
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

          {/* Content Type Filter */}
          <CustomDropdown
            value={contentTypeFilter}
            options={contentTypeOptions}
            onChange={resetToFirstPage(setContentTypeFilter)}
            placeholder="All Content"
            minWidth="135px"
          />

          {/* Post Type Filter */}
          <CustomDropdown
            value={postTypeFilter}
            options={postTypeOptions}
            onChange={resetToFirstPage(setPostTypeFilter)}
            placeholder="All Types"
            minWidth="125px"
          />

          {/* Date Range Picker */}
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
                <th style={{ width: "110px" }}>Type</th>
                <th style={{ width: "150px" }}>Status</th>
                <th style={{ width: "160px" }}>Created At</th>
                <th style={{ width: "80px", textAlign: "right" }}>Action</th>
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
                        style={{ height: "22px", width: "65px", borderRadius: "9999px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="posts-page__skeleton"
                        style={{ height: "28px", width: "110px", borderRadius: "6px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="posts-page__skeleton"
                        style={{ height: "13px", width: "110px" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        className="posts-page__skeleton"
                        style={{
                          height: "26px",
                          width: "60px",
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

                      {/* Type Badge */}
                      <td>
                        <PostTypeBadge type={post.type} />
                      </td>

                      {/* Status Dropdown */}
                      <td onClick={(e) => e.stopPropagation()}>
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
                          minWidth="120px"
                        />
                      </td>

                      {/* Created At */}
                      <td>
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
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="posts-page__btn-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(post);
                          }}
                          title="View post details"
                        >
                          <FiEye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Empty State
                <tr>
                  <td colSpan={6}>
                    <div className="posts-page__empty">
                      <div className="posts-page__empty-icon">
                        <FiFileText size={22} />
                      </div>
                      <div className="posts-page__empty-title">
                        No posts found
                      </div>
                      <div className="posts-page__empty-desc">
                        {hasActiveFilters
                          ? "No posts match your selected filter criteria."
                          : "There are currently no posts available in the system."}
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
                <strong className="text-dark">{totalCount.toLocaleString()}</strong> posts
              </>
            ) : (
              "0 posts"
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

export default PostsPage;
