import { useNavigate } from "react-router-dom";
import { Constants } from "@/Breads-Shared/Constants";
import { useGetPostsQuery } from "@/store/api/postApi";
import { useGetReportsQuery } from "@/store/api/reportApi";
import { useGetCurrentUserQuery, useGetUsersWithStatusQuery } from "@/store/api/userApi";

const renderCardValue = (
  isLoading: boolean,
  isError: boolean,
  value: number | undefined,
) => {
  if (isLoading) return "—";
  if (isError) return "—";
  return (value ?? 0).toLocaleString();
};

interface KpiCardProps {
  title: string;
  isLoading: boolean;
  isError: boolean;
  value: number | undefined;
  onClick: () => void;
}

const KpiCard = ({ title, isLoading, isError, value, onClick }: KpiCardProps) => (
  <div className="col">
    <div
      className="card h-100"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted">{title}</h6>
        <p className="card-text fs-2 fw-bold mb-0">
          {renderCardValue(isLoading, isError, value)}
        </p>
      </div>
    </div>
  </div>
);

const OverviewPage = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserQuery();
  const isAdmin = currentUser?.role === Constants.USER_ROLE.ADMIN;

  const {
    data: reportsResult,
    isLoading: isReportsLoading,
    isError: isReportsError,
  } = useGetReportsQuery(
    { page: 1, limit: 1 },
    { skip: !currentUser?._id },
  );

  const {
    data: postsResult,
    isLoading: isPostsLoading,
    isError: isPostsError,
  } = useGetPostsQuery(
    {
      userId: currentUser?._id ?? "",
      filterPage: "admin/posts/validation",
      page: 1,
      limit: 1,
    },
    { skip: !currentUser?._id },
  );

  const {
    data: usersResult,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useGetUsersWithStatusQuery(
    { page: 1, limit: 1 },
    { skip: !currentUser?._id || !isAdmin },
  );

  return (
    <div className="row row-cols-1 row-cols-md-3 g-3">
      <KpiCard
        title="Report PENDING"
        isLoading={isReportsLoading}
        isError={isReportsError}
        value={reportsResult?.totalCount}
        onClick={() => navigate("/report")}
      />
      <KpiCard
        title="Post PRE_ACCEPT"
        isLoading={isPostsLoading}
        isError={isPostsError}
        value={postsResult?.totalCount}
        onClick={() => navigate("/posts/validation")}
      />
      {isAdmin && (
        <KpiCard
          title="Total Users"
          isLoading={isUsersLoading}
          isError={isUsersError}
          value={usersResult?.count}
          onClick={() => navigate("/users")}
        />
      )}
    </div>
  );
};

export default OverviewPage;
