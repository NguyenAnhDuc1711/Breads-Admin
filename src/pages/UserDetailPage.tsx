import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiShield,
  FiAward,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiMail,
  FiActivity,
  FiCopy,
  FiCheck,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiClock,
  FiLock,
  FiSlash,
} from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IUser } from "@/Breads-Shared/Types";
import { useGetReportsByUserQuery } from "@/store/api/reportApi";
import {
  useAdminUpdateUserMutation,
  useGetUserAdminDetailQuery,
} from "@/store/api/userApi";
import { getUserStatusLabel } from "@/utils/userLabels";
import "./UserDetailPage.css";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const getEffectiveStatus = (user: IUser): number => {
  const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
  if (user.status === LOCK || user.status === BANNED) return user.status;
  if (user.lastActiveAt) {
    const lastActive = new Date(user.lastActiveAt).getTime();
    return Date.now() - lastActive <= ONLINE_THRESHOLD_MS ? ACTIVE : INACTIVE;
  }
  return INACTIVE;
};

const getReportStatusInfo = (status: number) => {
  const { PENDING, RESPONSED, REJECT } = Constants.REPORT_STATUS;
  switch (status) {
    case PENDING:
      return {
        label: "Pending",
        className: "badge bg-warning text-dark border border-warning",
      };
    case RESPONSED:
      return {
        label: "Responsed",
        className: "badge bg-success border border-success",
      };
    case REJECT:
      return {
        label: "Rejected",
        className: "badge bg-danger border border-danger",
      };
    default:
      return {
        label: "Unknown",
        className: "badge bg-secondary",
      };
  }
};

const UserRoleBadge = ({ role }: { role?: number }) => {
  const { ADMIN, MODERATOR } = Constants.USER_ROLE;
  if (role === ADMIN) {
    return (
      <span className="badge bg-purple-subtle text-purple border border-purple-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
        <FiShield size={11} /> Admin
      </span>
    );
  }
  if (role === MODERATOR) {
    return (
      <span className="badge bg-info-subtle text-info border border-info-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
        <FiAward size={11} /> Moderator
      </span>
    );
  }
  return (
    <span className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1 px-2 py-1">
      <FiUser size={11} /> User
    </span>
  );
};

const UserStatusBadge = ({ status }: { status: number }) => {
  const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
  switch (status) {
    case ACTIVE:
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
          <FiCheckCircle size={11} /> Online
        </span>
      );
    case INACTIVE:
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
          <FiClock size={11} /> Offline
        </span>
      );
    case LOCK:
      return (
        <span className="badge bg-warning-subtle text-danger border border-warning-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
          <FiLock size={11} /> Locked
        </span>
      );
    case BANNED:
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 px-2 py-1">
          <FiSlash size={11} /> Banned
        </span>
      );
    default:
      return (
        <span className="badge bg-light text-secondary border px-2 py-1">
          Unknown
        </span>
      );
  }
};

const UserReportHistory = ({ userId }: { userId: string }) => {
  const { data: reports, isFetching } = useGetReportsByUserQuery(userId);

  if (isFetching) {
    return (
      <div className="text-center py-3 text-muted small">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Loading reports...
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="user-detail__empty-reports">
        <div className="user-detail__empty-icon">
          <FiFileText size={18} />
        </div>
        <div className="fw-semibold text-dark small mb-0">
          No Reports Submitted
        </div>
        <p className="text-muted small mb-0" style={{ fontSize: "0.725rem" }}>
          User has not submitted any reports or complaints.
        </p>
      </div>
    );
  }

  return (
    <div className="user-detail__report-list">
      {reports.map((report) => {
        const statusInfo = getReportStatusInfo(report.status);
        return (
          <div key={report._id} className="user-detail__report-item">
            <div className="user-detail__report-header">
              <span className="user-detail__report-date">
                <FiClock size={10} />
                {new Date(report.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className={statusInfo.className} style={{ fontSize: "0.675rem", padding: "0.15rem 0.4rem" }}>
                {statusInfo.label}
              </span>
            </div>
            <div className="user-detail__report-content">
              {report.content || "(No details provided)"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UserAdminForm = ({ user }: { user: IUser }) => {
  const [adminUpdateUser, { isLoading: isSaving }] =
    useAdminUpdateUserMutation();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(
    user.status ?? Constants.USER_STATUS.ACTIVE,
  );
  const [reason, setReason] = useState(user.statusReason ?? "");
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = async () => {
    await adminUpdateUser({ userId: user._id, role, status, reason }).unwrap();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const isLockedOrBanned =
    status === Constants.USER_STATUS.LOCK ||
    status === Constants.USER_STATUS.BANNED;

  return (
    <div className="user-detail__form-wrap">
      {/* Role Selector Cards */}
      <div className="user-detail__form-group">
        <label className="user-detail__form-label">System Role & Permissions</label>
        <div className="user-detail__radio-grid">
          {/* User */}
          <div
            className={`user-detail__role-card ${role === Constants.USER_ROLE.USER ? "user-detail__role-card--active" : ""}`}
            onClick={() => setRole(Constants.USER_ROLE.USER)}
          >
            <FiUser size={15} className="text-secondary" />
            <span className="user-detail__role-card-title">User</span>
            <span className="user-detail__role-card-desc">Standard access</span>
          </div>

          {/* Moderator */}
          <div
            className={`user-detail__role-card ${role === Constants.USER_ROLE.MODERATOR ? "user-detail__role-card--active" : ""}`}
            onClick={() => setRole(Constants.USER_ROLE.MODERATOR)}
          >
            <FiAward size={15} className="text-info" />
            <span className="user-detail__role-card-title">Moderator</span>
            <span className="user-detail__role-card-desc">Content review</span>
          </div>

          {/* Admin */}
          <div
            className={`user-detail__role-card ${role === Constants.USER_ROLE.ADMIN ? "user-detail__role-card--active" : ""}`}
            onClick={() => setRole(Constants.USER_ROLE.ADMIN)}
          >
            <FiShield size={15} className="text-primary" />
            <span className="user-detail__role-card-title">Admin</span>
            <span className="user-detail__role-card-desc">Full access</span>
          </div>
        </div>
      </div>

      {/* Account Status Control */}
      <div className="user-detail__form-group">
        <label className="user-detail__form-label">Account Access State</label>
        <div className="user-detail__status-grid">
          {/* Normal */}
          <div
            className={`user-detail__status-card user-detail__status-card--normal ${status === Constants.USER_STATUS.ACTIVE || status === Constants.USER_STATUS.INACTIVE ? "user-detail__status-card--active" : ""}`}
            onClick={() => setStatus(Constants.USER_STATUS.ACTIVE)}
          >
            <div className="d-flex align-items-center gap-1">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Normal</div>
                <div className="text-muted" style={{ fontSize: "0.65rem" }}>Active / Offline</div>
              </div>
            </div>
            {(status === Constants.USER_STATUS.ACTIVE || status === Constants.USER_STATUS.INACTIVE) && (
              <FiCheck size={13} className="text-success flex-shrink-0" />
            )}
          </div>

          {/* Lock */}
          <div
            className={`user-detail__status-card user-detail__status-card--lock ${status === Constants.USER_STATUS.LOCK ? "user-detail__status-card--active" : ""}`}
            onClick={() => setStatus(Constants.USER_STATUS.LOCK)}
          >
            <div className="d-flex align-items-center gap-1">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f97316",
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Lock</div>
                <div className="text-muted" style={{ fontSize: "0.65rem" }}>Suspended</div>
              </div>
            </div>
            {status === Constants.USER_STATUS.LOCK && (
              <FiCheck size={13} className="text-warning flex-shrink-0" />
            )}
          </div>

          {/* Banned */}
          <div
            className={`user-detail__status-card user-detail__status-card--banned ${status === Constants.USER_STATUS.BANNED ? "user-detail__status-card--active" : ""}`}
            onClick={() => setStatus(Constants.USER_STATUS.BANNED)}
          >
            <div className="d-flex align-items-center gap-1">
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Banned</div>
                <div className="text-muted" style={{ fontSize: "0.65rem" }}>Restricted</div>
              </div>
            </div>
            {status === Constants.USER_STATUS.BANNED && (
              <FiCheck size={13} className="text-danger flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Reason Field */}
      <div className="user-detail__form-group">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="user-detail__form-label mb-0">
            Administrative Notes
          </label>
          {isLockedOrBanned && (
            <span className="text-danger" style={{ fontSize: "0.675rem" }}>
              * Required for Lock/Ban
            </span>
          )}
        </div>
        <textarea
          className="user-detail__textarea"
          placeholder="Enter reason for account action or internal notes..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {/* Action Footer */}
      <div className="user-detail__action-bar">
        {showSavedToast ? (
          <span className="user-detail__toast-success">
            <FiCheckCircle size={13} /> Changes saved successfully
          </span>
        ) : (
          <span className="text-muted" style={{ fontSize: "0.725rem" }}>
            Updates apply instantly to user session
          </span>
        )}

        <button
          type="button"
          className="user-detail__save-btn"
          disabled={isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <div className="spinner-border spinner-border-sm" role="status" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave size={13} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { data: user, isFetching } = useGetUserAdminDetailQuery(id ?? "", {
    skip: !id,
  });

  const effectiveStatus = useMemo(() => {
    if (!user) return Constants.USER_STATUS.INACTIVE;
    return getEffectiveStatus(user);
  }, [user]);

  const initials = useMemo(() => {
    if (user?.name?.trim()) {
      const parts = user.name.trim().split(" ");
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return user?.username?.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getStatusDotClass = (st: number) => {
    const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
    switch (st) {
      case ACTIVE:
        return "user-detail__status-dot--online";
      case INACTIVE:
        return "user-detail__status-dot--offline";
      case LOCK:
        return "user-detail__status-dot--lock";
      case BANNED:
        return "user-detail__status-dot--banned";
      default:
        return "user-detail__status-dot--offline";
    }
  };

  if (isFetching || !user) {
    return (
      <div className="user-detail-page d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-2" role="status" />
          <div className="text-muted fw-semibold small">Loading user details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-page">
      {/* Top Bar / Breadcrumb */}
      <div className="user-detail__top-nav">
        <button
          type="button"
          className="user-detail__back-btn"
          onClick={() => navigate("/users")}
        >
          <FiArrowLeft size={13} />
          <span>Back to Users</span>
        </button>

        <div className="user-detail__breadcrumb">
          <span className="user-detail__breadcrumb-item">Users</span>
          <span>/</span>
          <span className="user-detail__breadcrumb-item active">
            @{user.username}
          </span>
        </div>
      </div>

      {/* Hero / Header Card */}
      <div className="user-detail__hero-card">
        <div className="user-detail__hero-content">
          {/* Avatar + Basic Meta */}
          <div className="user-detail__profile-main">
            <div className="user-detail__avatar-wrap">
              {user.avatar && !imgError ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.username}
                  className="user-detail__avatar"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="user-detail__avatar-fallback">{initials}</div>
              )}
              <span
                className={`user-detail__status-dot ${getStatusDotClass(effectiveStatus)}`}
                title={`Status: ${getUserStatusLabel(effectiveStatus)}`}
              />
            </div>

            <div className="user-detail__user-meta">
              <div className="user-detail__name-row">
                <h1 className="user-detail__name">{user.name || "Anonymous"}</h1>
                <UserRoleBadge role={user.role} />
                <UserStatusBadge status={effectiveStatus} />
              </div>

              <div className="user-detail__handle-row">
                <span>@{user.username}</span>
                <span>&bull;</span>
                <span
                  className="user-detail__id-pill"
                  onClick={handleCopyId}
                  title="Click to copy User ID"
                >
                  <FiCopy size={10} />
                  <span>{user._id}</span>
                  {copiedId && <span className="text-success ms-1">✓ Copied</span>}
                </span>
              </div>

              {user.bio && <div className="user-detail__bio">{user.bio}</div>}
            </div>
          </div>

          {/* Metric Stats Pills */}
          <div className="user-detail__metrics-grid">
            <div className="user-detail__metric-box">
              <div className="user-detail__metric-icon user-detail__metric-icon--blue">
                <FiUsers />
              </div>
              <div className="user-detail__metric-info">
                <span className="user-detail__metric-value">
                  {(user.followersCount ?? 0).toLocaleString()}
                </span>
                <span className="user-detail__metric-label">Followers</span>
              </div>
            </div>

            <div className="user-detail__metric-box">
              <div className="user-detail__metric-icon user-detail__metric-icon--purple">
                <FiUserCheck />
              </div>
              <div className="user-detail__metric-info">
                <span className="user-detail__metric-value">
                  {(user.followingCount ?? 0).toLocaleString()}
                </span>
                <span className="user-detail__metric-label">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details + Right Governance */}
      <div className="user-detail__grid">
        {/* Left Column: Account Details & Reports */}
        <div className="user-detail__left-col">
          {/* Account Info Card */}
          <div className="user-detail__card user-detail__card--half">
            <div className="user-detail__card-header">
              <h2 className="user-detail__card-title">
                <FiUser className="user-detail__card-icon" />
                <span>Account Information</span>
              </h2>
            </div>

            <div className="user-detail__info-list">
              <div className="user-detail__info-item">
                <span className="user-detail__info-label">
                  <FiMail size={13} /> Email Address
                </span>
                <span className="user-detail__info-value">{user.email || "—"}</span>
              </div>

              <div className="user-detail__info-item">
                <span className="user-detail__info-label">
                  <FiCalendar size={13} /> Registered At
                </span>
                <span className="user-detail__info-value">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>

              <div className="user-detail__info-item">
                <span className="user-detail__info-label">
                  <FiActivity size={13} /> Last Active
                </span>
                <span className="user-detail__info-value">
                  {user.lastActiveAt
                    ? new Date(user.lastActiveAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : effectiveStatus === Constants.USER_STATUS.ACTIVE
                      ? "Active now"
                      : "No activity"}
                </span>
              </div>

              {user.statusReason && (
                <div className="user-detail__info-item align-items-start flex-column gap-1">
                  <span className="user-detail__info-label text-danger">
                    <FiAlertCircle size={13} /> Status Reason
                  </span>
                  <span className="user-detail__info-value text-start text-dark fw-normal small">
                    {user.statusReason}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Reports & Appeals Card */}
          <div className="user-detail__card user-detail__card--half">
            <div className="user-detail__card-header">
              <h2 className="user-detail__card-title">
                <FiFileText className="user-detail__card-icon" />
                <span>Submitted Reports & Appeals</span>
              </h2>
            </div>
            <UserReportHistory userId={user._id} />
          </div>
        </div>

        {/* Right Column: Governance Form */}
        <div className="user-detail__right-col">
          <div className="user-detail__card user-detail__card--full">
            <div className="user-detail__card-header">
              <h2 className="user-detail__card-title">
                <FiShield className="user-detail__card-icon" />
                <span>Administration & Governance</span>
              </h2>
            </div>
            <UserAdminForm key={user._id} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
