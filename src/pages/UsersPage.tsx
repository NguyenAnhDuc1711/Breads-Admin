import { useState } from "react";
import { Constants } from "@/Breads-Shared/Constants";
import PaginationBtn from "@/components/PaginationBtn";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetCurrentUserQuery,
  useGetUsersWithStatusQuery,
  useUpdateUserStatusMutation,
} from "@/store/api/userApi";
import "./UsersPage.css";

const ROWS_PER_PAGE = 7;
const TABLE_COLUMNS = ["name", "username", "avatar", "status", "action"];

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

  return (
    <div className="container-fluid">
      <div className="my-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      <div className="users-page__table-wrap">
        <table className="table table-striped table-bordered table-responsive">
          <thead
            className="thead-dark"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "white",
            }}
          >
            <tr>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col}
                  style={{
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    padding: "12px 16px",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : data?.users && data.users.length > 0 ? (
              data.users.map((user) => (
                <tr key={user._id}>
                  <td style={{ minWidth: "120px", maxWidth: "25%" }}>
                    <span className="users-page__truncate">{user.name}</span>
                  </td>
                  <td style={{ minWidth: "120px", maxWidth: "20%" }}>
                    <span className="users-page__truncate">
                      {user.username}
                    </span>
                  </td>
                  <td style={{ minWidth: "80px", width: "15%" }}>
                    <img
                      src={user.avatar}
                      width={60}
                      height={60}
                      style={{
                        objectFit: "cover",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                      alt={
                        user.username
                          ? `${user.username}'s avatar`
                          : "User avatar"
                      }
                    />
                  </td>
                  <td style={{ minWidth: "100px", width: "20%" }}>
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
                  </td>
                  <td
                    style={{
                      minWidth: "120px",
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    <button
                      className="btn btn-sm btn-dark"
                      onClick={() => {
                        window.location.href = `/users/${user._id}`;
                      }}
                    >
                      See detail
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="text-center">
                  No matching data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav className="d-flex justify-content-center mt-3">
          <PaginationBtn
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </nav>
      )}
    </div>
  );
};

export default UsersPage;
