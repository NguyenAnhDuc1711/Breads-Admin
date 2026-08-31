import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IPost } from "@/Breads-Shared/Types";
import "./index.css";

interface PostDetailModalProps {
  post: IPost | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<number, string> = {
  [Constants.POST_STATUS.PRE_ACCEPT]: "Pending",
  [Constants.POST_STATUS.PUBLIC]: "Public",
  [Constants.POST_STATUS.DELETED]: "Deleted",
};

const VISIBILITY_LABEL: Record<number, string> = {
  [Constants.POST_VISIBILITY.PUBLIC]: "Public",
  [Constants.POST_VISIBILITY.ONLY_FOLLOWERS]: "Followers only",
  [Constants.POST_VISIBILITY.ONLY_ME]: "Only me",
};

const MediaItem = ({ url, type }: { url: string; type: string }) => {
  if (type === Constants.MEDIA_TYPE.VIDEO) {
    return (
      <video src={url} controls className="post-detail-modal__media-item" />
    );
  }
  // GIF và IMAGE đều render bằng <img> — trình duyệt tự phát GIF động.
  return (
    <img
      src={url}
      alt=""
      className="post-detail-modal__media-item"
      loading="lazy"
    />
  );
};

const QuotedPostPreview = ({
  label,
  post,
}: {
  label: string;
  post: any;
}) => {
  if (!post || (!post.content && !post._id)) return null;
  return (
    <div className="post-detail-modal__quoted">
      <div className="post-detail-modal__quoted-label">{label}</div>
      <div className="post-detail-modal__quoted-author">
        {post.authorInfo?.username
          ? `@${post.authorInfo.username}`
          : post.authorId || "unknown"}
      </div>
      <div className="post-detail-modal__quoted-content">
        {post.content || <span className="text-muted">(no text)</span>}
      </div>
    </div>
  );
};

const PostDetailModal = ({ post, onClose }: PostDetailModalProps) => {
  // Đóng bằng phím Esc — hành vi modal tiêu chuẩn.
  useEffect(() => {
    if (!post) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [post, onClose]);

  if (!post) return null;

  const survey = post.survey ?? [];
  const media = post.media ?? [];
  const links = (post.linksInfo as any[]) ?? [];

  return (
    <div className="post-detail-modal__overlay" onClick={onClose}>
      <div
        className="post-detail-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-detail-modal__header">
          <div className="d-flex align-items-center gap-2">
            {post.authorInfo?.avatar ? (
              <img
                src={post.authorInfo.avatar}
                alt={post.authorInfo.username}
                className="post-detail-modal__avatar"
              />
            ) : (
              <div className="post-detail-modal__avatar post-detail-modal__avatar--fallback">
                {(post.authorInfo?.username || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                {post.authorInfo?.name || "Unknown"}
              </div>
              <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                @{post.authorInfo?.username || "unknown"}
                {post.createdAt
                  ? ` · ${new Date(post.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="post-detail-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="post-detail-modal__body">
          <div className="d-flex flex-wrap gap-2 mb-2">
            <span className="badge text-bg-light border text-capitalize">
              {post.type || "create"}
            </span>
            {post.status !== undefined && (
              <span className="badge text-bg-light border">
                {STATUS_LABEL[post.status] ?? post.status}
              </span>
            )}
            {post.visibility !== undefined && (
              <span className="badge text-bg-light border">
                {VISIBILITY_LABEL[post.visibility] ?? post.visibility}
              </span>
            )}
          </div>

          {post.content && (
            <p className="post-detail-modal__content-text">{post.content}</p>
          )}

          {media.length > 0 && (
            <div className="post-detail-modal__media-grid">
              {media.map((m, i) => (
                <MediaItem key={m.url || i} url={m.url} type={m.type} />
              ))}
            </div>
          )}

          {survey.length > 0 && (
            <div className="post-detail-modal__survey">
              {survey.map((option, i) => (
                <div key={option._id || i} className="post-detail-modal__survey-option">
                  <span>{option.placeholder || option.value}</span>
                  <span className="text-muted small">
                    {option.usersId?.length ?? 0} vote
                    {(option.usersId?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {links.length > 0 && (
            <div className="post-detail-modal__links">
              {links.map((link, i) => (
                <a
                  key={link._id || i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="post-detail-modal__link"
                >
                  {link.url}
                </a>
              ))}
            </div>
          )}

          <QuotedPostPreview label="Replying to" post={post.parentPostInfo} />
          <QuotedPostPreview label="Quoting" post={post.quote} />

          <div className="post-detail-modal__stats">
            <span>{post.likesCount ?? 0} likes</span>
            <span>{post.repliesCount ?? 0} replies</span>
            <span>{post.repostNum ?? 0} reposts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
