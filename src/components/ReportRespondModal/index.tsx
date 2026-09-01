import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useGetCurrentUserQuery } from "@/store/api/userApi";
import {
  useResponseReportMutation,
  type IReportQueueItem,
} from "@/store/api/reportApi";
import "./index.css";

interface ReportRespondModalProps {
  report: IReportQueueItem | null;
  onClose: () => void;
}

// [plan-review FAIL-1] body từ textarea gửi thẳng làm field `html` cho nodemailer
// sẽ mất line-break và có thể vỡ HTML nếu chứa <, >, & — escape rồi convert \n
// thành <br> trước khi build payload. KHÔNG lưu bản đã convert vào state (body
// trong state luôn giữ plain text để user tiếp tục edit đúng những gì họ gõ).
const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toHtmlBody = (text: string) => escapeHtml(text).replace(/\n/g, "<br>");

const ReportRespondModal = ({ report, onClose }: ReportRespondModalProps) => {
  const { data: currentUser } = useGetCurrentUserQuery();
  const [respondReport, { isLoading, error }] = useResponseReportMutation();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Reset chỉ khi report đổi (mở modal cho report khác) — KHÔNG reset khi lỗi (FR-5).
  useEffect(() => {
    setSubject("");
    setBody("");
  }, [report?._id]);

  // Đóng bằng phím Esc — mirror PostDetailModal.
  useEffect(() => {
    if (!report) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [report, onClose]);

  if (!report) return null;

  const handleSubmit = async () => {
    if (!report || isLoading) return;
    try {
      await respondReport({
        id: report._id,
        to: report.userReport.email,
        subject,
        html: toHtmlBody(body),
        userId: currentUser?._id ?? "",
      }).unwrap();
      onClose();
    } catch {
      // Lỗi: KHÔNG đóng modal, KHÔNG reset subject/body — giữ nguyên (FR-5)
    }
  };

  return (
    <div className="report-respond-modal__overlay" onClick={onClose}>
      <div
        className="report-respond-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-respond-modal__header">
          <div className="fw-semibold" style={{ fontSize: "0.95rem" }}>
            Respond to Report
          </div>
          <button
            type="button"
            className="report-respond-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="report-respond-modal__body">
          <div className="report-respond-modal__field">
            <label className="report-respond-modal__label">To</label>
            <input
              type="text"
              className="form-control"
              value={report.userReport?.email ?? ""}
              readOnly
            />
          </div>

          <div className="report-respond-modal__field">
            <label className="report-respond-modal__label">Subject</label>
            <input
              type="text"
              className="form-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div className="report-respond-modal__field">
            <label className="report-respond-modal__label">Body</label>
            <textarea
              className="form-control report-respond-modal__textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your response..."
              rows={6}
            />
          </div>

          {error && (
            <div className="report-respond-modal__error">
              Gửi thất bại, thử lại
            </div>
          )}
        </div>

        <div className="report-respond-modal__footer">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm px-3"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-dark btn-sm px-3"
            onClick={handleSubmit}
            disabled={isLoading || !subject}
          >
            {isLoading ? "Đang gửi..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportRespondModal;
