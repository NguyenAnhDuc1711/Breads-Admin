import { useState } from "react";
import { Constants } from "@/Breads-Shared/Constants";
import type { IUser } from "@/Breads-Shared/Types";
import SearchableTable, {
  type SearchableTableColumn,
} from "@/components/SearchableTable";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetCurrentUserQuery,
  useGetUsersWithStatusQuery,
  useUpdateUserStatusMutation,
} from "@/store/api/userApi";
import "./UsersPage.css";

const ROWS_PER_PAGE = 7;

const convertUserStatus = (status: number) => {
  const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
  switch (status) {
    case ACTIVE:
      return "Active";
    case INACTIVE:
      return "Inactive";
    case LOCK:
      return "Lock";
    case BANNED:
      return "Banned";
    default:
      return "";
  }
};

const UsersPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const debounceSearch = useDebounce(searchValue);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: currentUser } = useGetCurrentUserQuery();
  const { data, isFetching } = useGetUsersWithStatusQuery(
    {
      userId: currentUser?._id ?? "",
      page: currentPage,
      limit: ROWS_PER_PAGE,
      searchValue: debounceSearch,
    },
    { skip: !currentUser },
  );
  const [updateUserStatus] = useUpdateUserStatusMutation();

  const totalPages = Math.ceil((data?.count ?? 0) / ROWS_PER_PAGE);

  const columns: SearchableTableColumn<IUser>[] = [
    {
      key: "name",
      header: "name",
      cellStyle: { minWidth: "120px", maxWidth: "25%" },
      render: (user) => (
        <span className="users-page__truncate">{user.name}</span>
      ),
    },
    {
      key: "username",
      header: "username",
      cellStyle: { minWidth: "120px", maxWidth: "20%" },
      render: (user) => (
        <span className="users-page__truncate">{user.username}</span>
      ),
    },
    {
      key: "avatar",
      header: "avatar",
      cellStyle: { minWidth: "80px", width: "15%" },
      render: (user) => (
        <img
          src={user.avatar}
          width={60}
          height={60}
          style={{
            objectFit: "cover",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          alt={user.username ? `${user.username}'s avatar` : "User avatar"}
        />
      ),
    },
    {
      key: "status",
      header: "status",
      cellStyle: { minWidth: "100px", width: "20%" },
      render: (user) => (
        <select
          defaultValue={user.status}
          onChange={(e) =>
            updateUserStatus({
              userId: user._id,
              status: Number(e.target.value),
            })
          }
          style={{
            backgroundColor: "white",
            width: "100%",
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ced4da",
          }}
        >
          {Object.values(Constants.USER_STATUS).map((status) => (
            <option key={status} value={status}>
              {convertUserStatus(status)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "action",
      header: "action",
      cellStyle: { minWidth: "120px", width: "20%", textAlign: "center" },
      render: (user) => (
        <button
          className="btn btn-sm btn-dark"
          onClick={() => {
            window.location.href = `/users/${user._id}`;
          }}
        >
          See detail
        </button>
      ),
    },
  ];

  return (
    <SearchableTable
      columns={columns}
      data={data?.users ?? []}
      rowKey={(user) => user._id}
      loading={isFetching}
      searchValue={searchValue}
      onSearchChange={(value) => {
        setSearchValue(value);
        setCurrentPage(1);
      }}
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
    />
  );
};

export default UsersPage;
