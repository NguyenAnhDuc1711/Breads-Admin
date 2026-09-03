import { useState, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiAward,
  FiUser,
  FiEye,
  FiRotateCcw,
  FiUsers,
  FiCheck,
  FiChevronDown,
} from "react-icons/fi";
import { Constants } from "@/Breads-Shared/Constants";
import type { IUser } from "@/Breads-Shared/Types";
import CustomDropdown, { type DropdownOption } from "@/components/CustomDropdown";
import DateRangePicker from "@/components/DateRangePicker";
import PaginationBtn from "@/components/PaginationBtn";
import useDebounce from "@/hooks/useDebounce";
import {
  useAdminUpdateUserMutation,
  useGetCurrentUserQuery,
  useGetUsersWithStatusQuery,
  useLazyGetUsersWithStatusQuery,
} from "@/store/api/userApi";
import { downloadCsv, toCsv } from "@/utils/csv";
import { getUserRoleLabel, getUserStatusLabel } from "@/utils/userLabels";
import "./UsersPage.css";

const EXPORT_ALL_LIMIT = 1_000_000;
const ROWS_PER_PAGE = 10;
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

const UserAvatar = ({
  avatar,
  name,
  username,
  effectiveStatus,
}: {
  avatar?: string;
  name?: string;
  username?: string;
  effectiveStatus: number;
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = useMemo(() => {
    if (name?.trim()) {
      const parts = name.trim().split(" ");
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return username?.slice(0, 2).toUpperCase() || "U";
  }, [name, username]);

  const getStatusDotClass = (st: number) => {
    const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
    switch (st) {
      case ACTIVE:
        return "users-page__status-dot--active";
      case INACTIVE:
        return "users-page__status-dot--inactive";
      case LOCK:
        return "users-page__status-dot--lock";
      case BANNED:
        return "users-page__status-dot--banned";
      default:
        return "users-page__status-dot--inactive";
    }
  };

  return (
    <div className="users-page__avatar-wrap">
      {avatar && !imgError ? (
        <img
          src={avatar}
          alt={name || username || "Avatar"}
          className="users-page__avatar"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="users-page__avatar-fallback">{initials}</div>
      )}
      <span
        className={`users-page__status-dot ${getStatusDotClass(effectiveStatus)}`}
        title={`Status: ${getUserStatusLabel(effectiveStatus)}`}
      />
    </div>
  );
};

const UserRoleBadge = ({ role }: { role?: number }) => {
  const { ADMIN, MODERATOR } = Constants.USER_ROLE;
  let badgeClass = "users-page__role-badge--user";
  let IconComponent = FiUser;

  if (role === ADMIN) {
    badgeClass = "users-page__role-badge--admin";
    IconComponent = FiShield;
  } else if (role === MODERATOR) {
    badgeClass = "users-page__role-badge--moderator";
    IconComponent = FiAward;
  }

  return (
    <span className={`users-page__role-badge ${badgeClass}`}>
      <IconComponent size={12} />
      {getUserRoleLabel(role)}
    </span>
  );
};

const getStatusTheme = (st: number) => {
  const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
  switch (st) {
    case ACTIVE:
      return {
        bg: "#f0fdf4",
        color: "#166534",
        border: "#bbf7d0",
        dot: "#22c55e",
      };
    case INACTIVE:
      return {
        bg: "#fffbeb",
        color: "#92400e",
        border: "#fde68a",
        dot: "#f59e0b",
      };
    case LOCK:
      return {
        bg: "#fff7ed",
        color: "#9a3412",
        border: "#fed7aa",
        dot: "#f97316",
      };
    case BANNED:
      return {
        bg: "#fef2f2",
        color: "#991b1b",
        border: "#fecaca",
        dot: "#ef4444",
      };
    default:
      return {
        bg: "#f8fafc",
        color: "#475569",
        border: "#e2e8f0",
        dot: "#94a3b8",
      };
  }
};

const UserStatusSelect = ({
  status,
  onChange,
}: {
  status?: number;
  onChange: (newStatus: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { ACTIVE } = Constants.USER_STATUS;
  const currentStatus = status ?? ACTIVE;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentTheme = getStatusTheme(currentStatus);

  return (
    <div
      ref={dropdownRef}
      className="users-page__status-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="users-page__status-trigger"
        style={{
          backgroundColor: currentTheme.bg,
          color: currentTheme.color,
          borderColor: currentTheme.border,
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span
          className="users-page__status-dot-inline"
          style={{ backgroundColor: currentTheme.dot }}
        />
        <span>{getUserStatusLabel(currentStatus)}</span>
        <FiChevronDown
          size={11}
          className={`users-page__status-chevron ${isOpen ? "users-page__status-chevron--open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="users-page__status-menu">
          {Object.values(Constants.USER_STATUS).map((s) => {
            const isSelected = s === currentStatus;
            const theme = getStatusTheme(s);
            return (
              <button
                key={s}
                type="button"
                className={`users-page__status-option ${isSelected ? "users-page__status-option--selected" : ""}`}
                onClick={() => {
                  if (!isSelected) {
                    onChange(s);
                  }
                  setIsOpen(false);
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="users-page__status-dot-inline"
                    style={{ backgroundColor: theme.dot }}
                  />
                  <span>{getUserStatusLabel(s)}</span>
                </div>
                {isSelected && <FiCheck size={13} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const debounceSearch = useDebounce(searchValue);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: currentUser } = useGetCurrentUserQuery();
  const { data, isFetching, refetch } = useGetUsersWithStatusQuery(
    {
      page: currentPage,
      limit: ROWS_PER_PAGE,
      searchValue: debounceSearch,
      role: roleFilter === "" ? undefined : Number(roleFilter),
      status: statusFilter === "" ? undefined : Number(statusFilter),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { skip: !currentUser },
  );
  const [adminUpdateUser] = useAdminUpdateUserMutation();
  const [triggerExport, { isFetching: isExporting }] =
    useLazyGetUsersWithStatusQuery();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(Constants.USER_STATUS.ACTIVE);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const clearSelection = () => setSelectedIds(new Set());

  const hasActiveFilters =
    Boolean(searchValue) ||
    roleFilter !== "" ||
    statusFilter !== "" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const handleResetFilters = () => {
    setSearchValue("");
    setRoleFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    clearSelection();
  };

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setCurrentPage(1);
    clearSelection();
  };

  const handlePageChange: Dispatch<SetStateAction<number>> = (value) => {
    setCurrentPage(value);
    clearSelection();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentPageIds = (data?.users ?? []).map((user) => user._id);
  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  const toggleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleApplyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setIsApplyingBulk(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((userId) =>
          adminUpdateUser({ userId, status: bulkStatus }).unwrap(),
        ),
      );
    } finally {
      setIsApplyingBulk(false);
      clearSelection();
    }
  };

  const handleExportCsv = async () => {
    const result = await triggerExport({
      page: 1,
      limit: EXPORT_ALL_LIMIT,
      searchValue: debounceSearch,
      role: roleFilter === "" ? undefined : Number(roleFilter),
      status: statusFilter === "" ? undefined : Number(statusFilter),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }).unwrap();

    const rows = result.users.map((user) => [
      user._id,
      user.name,
      user.username,
      user.email || "",
      getUserRoleLabel(user.role),
      getUserStatusLabel(getEffectiveStatus(user)),
      user.createdAt ? new Date(user.createdAt).toLocaleString() : "",
    ]);
    const csv = toCsv(
      ["ID", "Name", "Username", "Email", "Role", "Status", "Created At"],
      rows,
    );
    downloadCsv(csv, `users_export_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const roleOptions: DropdownOption<string>[] = useMemo(
    () => [
      { value: "", label: "All Roles", icon: <FiUsers size={12} className="text-muted" /> },
      { value: String(Constants.USER_ROLE.ADMIN), label: "Admin", icon: <FiShield size={12} className="text-primary" /> },
      { value: String(Constants.USER_ROLE.MODERATOR), label: "Moderator", icon: <FiAward size={12} className="text-info" /> },
      { value: String(Constants.USER_ROLE.USER), label: "User", icon: <FiUser size={12} className="text-secondary" /> },
    ],
    [],
  );

  const statusOptions: DropdownOption<string>[] = useMemo(
    () => [
      { value: "", label: "All Statuses", dotColor: "#94a3b8" },
      { value: String(Constants.USER_STATUS.ACTIVE), label: "Online", dotColor: "#22c55e" },
      { value: String(Constants.USER_STATUS.INACTIVE), label: "Offline", dotColor: "#f59e0b" },
      { value: String(Constants.USER_STATUS.LOCK), label: "Lock", dotColor: "#f97316" },
      { value: String(Constants.USER_STATUS.BANNED), label: "Banned", dotColor: "#ef4444" },
    ],
    [],
  );

  const bulkStatusOptions: DropdownOption<number>[] = useMemo(
    () => [
      { value: Constants.USER_STATUS.LOCK, label: "Lock", dotColor: "#f97316" },
      { value: Constants.USER_STATUS.BANNED, label: "Banned", dotColor: "#ef4444" },
    ],
    [],
  );

  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);
  const currentRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const currentRangeEnd = Math.min(currentPage * ROWS_PER_PAGE, totalCount);

  return (
    <div className="users-page">
      {/* Compact Header */}
      <div className="users-page__header">
        <div>
          <div className="users-page__header-left">
            <h1 className="users-page__title">User Management</h1>
            <span className="users-page__badge-total">
              {totalCount.toLocaleString()} users
            </span>
          </div>
          <p className="users-page__subtitle">
            Manage user roles, permissions, account statuses, and system access
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 px-2 py-1"
            style={{ height: "34px", fontSize: "0.8rem" }}
            onClick={() => refetch()}
            title="Refresh list"
          >
            <FiRefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-dark btn-sm d-flex align-items-center gap-1 px-3 py-1"
            style={{ height: "34px", fontSize: "0.8rem" }}
            disabled={isExporting}
            onClick={handleExportCsv}
          >
            <FiDownload size={13} />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="users-page__filter-card">
        <div className="users-page__filters-row">
          {/* Search Box */}
          <div className="users-page__search-wrap">
            <span className="users-page__search-icon">
              <FiSearch size={14} />
            </span>
            <input
              type="text"
              className="form-control users-page__search-input"
              placeholder="Search by name, username..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
                clearSelection();
              }}
            />
            {searchValue && (
              <button
                type="button"
                className="users-page__search-clear"
                onClick={() => {
                  setSearchValue("");
                  setCurrentPage(1);
                  clearSelection();
                }}
                title="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Custom Role Filter Dropdown */}
          <CustomDropdown
            value={roleFilter}
            options={roleOptions}
            onChange={(val) => resetToFirstPage(setRoleFilter)(val)}
            placeholder="All Roles"
            minWidth="125px"
          />

          {/* Custom Status Filter Dropdown */}
          <CustomDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(val) => resetToFirstPage(setStatusFilter)(val)}
            placeholder="All Statuses"
            minWidth="135px"
          />

          {/* Custom Date Range Picker */}
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
              setCurrentPage(1);
              clearSelection();
            }}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
              setCurrentPage(1);
              clearSelection();
            }}
          />

          {/* Reset Filters Button */}
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

      {/* Bulk Action Banner */}
      {selectedIds.size > 0 && (
        <div className="users-page__bulk-banner">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary rounded-pill px-2 py-1 d-flex align-items-center gap-1">
              <FiCheck size={11} /> {selectedIds.size}
            </span>
            <span className="fw-semibold text-dark small">
              user{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Set status:</span>
            <CustomDropdown
              value={bulkStatus}
              options={bulkStatusOptions}
              onChange={(val) => setBulkStatus(val)}
              size="sm"
              minWidth="115px"
            />

            <button
              className="btn btn-sm btn-dark px-2 py-1"
              style={{ height: "30px", fontSize: "0.8rem" }}
              disabled={isApplyingBulk}
              onClick={handleApplyBulkStatus}
            >
              {isApplyingBulk ? "Updating..." : "Apply"}
            </button>

            <button
              className="btn btn-sm btn-outline-secondary px-2 py-1"
              style={{ height: "30px", fontSize: "0.8rem" }}
              onClick={clearSelection}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Data Table Card (Full height flex child) */}
      <div className="users-page__table-card">
        <div className="users-page__table-wrap">
          <table className="users-page__table">
            <thead>
              <tr>
                <th style={{ width: "42px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    className="form-check-input m-0 cursor-pointer"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAllCurrentPage}
                    title="Select all on this page"
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                Array.from({ length: ROWS_PER_PAGE }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td style={{ textAlign: "center" }}>
                      <div
                        className="users-page__skeleton"
                        style={{ width: "16px", height: "16px", margin: "0 auto" }}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="users-page__skeleton"
                          style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                        />
                        <div className="d-flex flex-column gap-1" style={{ width: "130px" }}>
                          <div
                            className="users-page__skeleton"
                            style={{ height: "13px", width: "100%" }}
                          />
                          <div
                            className="users-page__skeleton"
                            style={{ height: "10px", width: "60%" }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        className="users-page__skeleton"
                        style={{ height: "13px", width: "140px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="users-page__skeleton"
                        style={{ height: "22px", width: "65px", borderRadius: "9999px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="users-page__skeleton"
                        style={{ height: "24px", width: "80px", borderRadius: "9999px" }}
                      />
                    </td>
                    <td>
                      <div
                        className="users-page__skeleton"
                        style={{ height: "13px", width: "80px" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        className="users-page__skeleton"
                        style={{
                          height: "26px",
                          width: "70px",
                          marginLeft: "auto",
                          borderRadius: "6px",
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (data?.users ?? []).length > 0 ? (
                data!.users.map((user: IUser) => {
                  const isSelected = selectedIds.has(user._id);
                  return (
                    <tr
                      key={user._id}
                      style={{
                        backgroundColor: isSelected ? "#f8fafc" : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/users/${user._id}`)}
                    >
                      {/* Checkbox */}
                      <td
                        style={{ textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input m-0 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(user._id)}
                        />
                      </td>

                      {/* User Avatar + Name + Username */}
                      <td>
                        <div className="users-page__user-cell">
                          <UserAvatar
                            avatar={user.avatar}
                            name={user.name}
                            username={user.username}
                            effectiveStatus={getEffectiveStatus(user)}
                          />
                          <div className="users-page__user-info">
                            <span className="users-page__user-name" title={user.name}>
                              {user.name || "Anonymous"}
                            </span>
                            <span className="users-page__user-username">
                              @{user.username || "no-username"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="text-muted small">
                          {user.email || "—"}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <UserRoleBadge role={user.role} />
                      </td>

                      {/* Custom Status Dropdown */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <UserStatusSelect
                          status={getEffectiveStatus(user)}
                          onChange={(newStatus) =>
                            adminUpdateUser({
                              userId: user._id,
                              status: newStatus,
                            })
                          }
                        />
                      </td>

                      {/* Joined Date */}
                      <td>
                        <span className="text-muted small">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="users-page__action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${user._id}`);
                          }}
                        >
                          <FiEye size={12} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="users-page__empty">
                      <div className="users-page__empty-icon">
                        <FiUsers size={22} />
                      </div>
                      <div className="users-page__empty-title">
                        No users found
                      </div>
                      <div className="users-page__empty-desc">
                        {hasActiveFilters
                          ? "We couldn't find any users matching your filter criteria."
                          : "There are currently no users in the system."}
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
        <div className="users-page__table-footer">
          <div className="users-page__footer-info">
            {totalCount > 0 ? (
              <>
                Showing <strong className="text-dark">{currentRangeStart}</strong> to{" "}
                <strong className="text-dark">{currentRangeEnd}</strong> of{" "}
                <strong className="text-dark">{totalCount.toLocaleString()}</strong> users
              </>
            ) : (
              "0 users"
            )}
          </div>

          <PaginationBtn
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
