import { useState } from "react";
import { FiSearch, FiX, FiClock, FiPaperclip, FiMail, FiXCircle } from "react-icons/fi";
import PaginationBtn from "@/components/PaginationBtn";
import useDebounce from "@/hooks/useDebounce";
import { useGetCurrentUserQuery } from "@/store/api/userApi";
import {
  useGetReportsQuery,
  useRejectReportMutation,
  type IReportQueueItem,
} from "@/store/api/reportApi";
import "./PostsPage.css";

const ROWS_PER_PAGE = 10;

const ReportPage = () => {
  const { data: currentUser } = useGetCurrentUserQuery();

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue);
  const [currentPage, setCurrentPage] = useState(1);
  // selectedReport is consumed by task #21 (ReportRespondModal, not yet built) — kept here
  // so the Respond action can wire straight into it once that component lands.
  const [selectedReport, setSelectedReport] = useState<IReportQueueItem | null>(null);
  void selectedReport;

  const {
    data: result,
    isFetching,
    isError,
    refetch,
  } = useGetReportsQuery(
    {
      userId: currentUser?._id ?? "",
      searchValue: debouncedSearch,
      page: currentPage,
      limit: ROWS_PER_PAGE,
    },
    { skip: !currentUser },
  );
  const reports = result?.data ?? [];

  const [rejectReport] = useRejectReportMutation();

  const handleReject = (reportId: string) => {
    if (!currentUser) return;
    rejectReport({ id: reportId, userId: currentUser._id });
  };

  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  const currentRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const currentRangeEnd = Math.min(currentPage * ROWS_PER_PAGE, totalCount);

  return (
    <div className="posts-page">
      {/* Header */}
      <div className="posts-page__header">
        <div>
          <div className="posts-page__header-left">
            <h1 className="posts-page__title">Reports</h1>
            <span className="posts-page__badge-queue">
              {totalCount.toLocaleString()} pending queue
            </span>
          </div>
          <p className="posts-page__subtitle">
            Review queue for pending user reports awaiting a response
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="posts-page__filter-card">
        <div className="posts-page__filters-row">
          <div className="posts-page__search-wrap">
            <span className="posts-page__search-icon">
              <FiSearch size={14} />
            </span>
            <input
              type="text"
              className="form-control posts-page__search-input"
              placeholder="Search content or reporter in queue..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchValue && (
              <button
                type="button"
                className="posts-page__search-clear"
                onClick={() => {
                  setSearchValue("");
                  setCurrentPage(1);
                }}
                title="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="posts-page__table-card">
        <div className="posts-page__table-wrap">
          <table className="posts-page__table">
            <thead>
              <tr>
                <th style={{ width: "200px" }}>Reporter</th>
                <th>Content & Attachment</th>
                <th style={{ width: "170px" }}>Submitted At</th>
                <th style={{ width: "200px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
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
                          width: "160px",
                          marginLeft: "auto",
                          borderRadius: "6px",
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4}>
                    <div className="posts-page__empty">
                      <div className="posts-page__empty-title">
                        Không tải được danh sách report
                      </div>
                      <div className="posts-page__empty-desc">
                        Lỗi kết nối tới server — thử làm mới trang.
                      </div>
                      <button
                        className="btn btn-outline-dark btn-sm px-3"
                        onClick={() => refetch()}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report._id}>
                    {/* Reporter */}
                    <td>
                      <div className="posts-page__author-cell">
                        <div className="posts-page__avatar-wrap">
                          {report.userReport?.avatar ? (
                            <img
                              src={report.userReport.avatar}
                              alt={report.userReport.username}
                              className="posts-page__avatar"
                            />
                          ) : (
                            <div className="posts-page__avatar-fallback">
                              {(report.userReport?.username || "U").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="posts-page__author-info">
                          <span
                            className="posts-page__author-name"
                            title={report.userReport?.name}
                          >
                            {report.userReport?.name || "Unknown"}
                          </span>
                          <span className="posts-page__author-username">
                            @{report.userReport?.username || "unknown"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Content & Attachment */}
                    <td>
                      <div className="posts-page__content-wrap">
                        <span className="posts-page__content-text" title={report.content}>
                          {report.content || "(No text content)"}
                        </span>
                        {report.media?.length > 0 && (
                          <div className="posts-page__media-tags">
                            <span className="posts-page__media-pill">
                              <FiPaperclip size={10} /> {report.media.length} attachment(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Submitted At */}
                    <td>
                      <span className="text-muted small d-inline-flex align-items-center gap-1">
                        <FiClock size={11} className="text-muted" />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString("en-US", {
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
                      <div className="posts-page__action-group">
                        <button
                          type="button"
                          className="posts-page__btn-view"
                          onClick={() => setSelectedReport(report)}
                          title="Respond to this report"
                        >
                          <FiMail size={12} />
                          <span>Respond</span>
                        </button>

                        <button
                          type="button"
                          className="posts-page__btn-takedown"
                          onClick={() => handleReject(report._id)}
                          title="Reject this report"
                        >
                          <FiXCircle size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="posts-page__empty">
                      <div className="posts-page__empty-title">
                        Không có report nào đang chờ xử lý
                      </div>
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
                <strong className="text-dark">{totalCount.toLocaleString()}</strong> reports in
                queue
              </>
            ) : (
              "0 reports in queue"
            )}
          </div>

          <PaginationBtn
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* selectedReport state is wired for task #21 (ReportRespondModal) to consume */}
    </div>
  );
};

export default ReportPage;
