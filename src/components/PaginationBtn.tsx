import { useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationBtnProps {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
}

const PaginationBtn = ({
  totalPages,
  currentPage,
  setCurrentPage,
}: PaginationBtnProps) => {
  const displayPages = useMemo(() => {
    if (totalPages <= 0) return [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    const pages: number[] = [];
    for (let page = start; page <= end; page++) {
      pages.push(page);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <ul className="pagination pagination-sm m-0 gap-1 align-items-center">
      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
        <button
          className="page-link rounded-2 px-2 py-1 d-flex align-items-center gap-1 text-dark"
          style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", height: "30px" }}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <FiChevronLeft size={14} />
          <span style={{ fontSize: "0.8rem" }}>Prev</span>
        </button>
      </li>
      {displayPages.map((pageNum) => {
        const isActive = currentPage === pageNum;
        return (
          <li key={pageNum} className={`page-item ${isActive ? "active" : ""}`}>
            <button
              className="page-link rounded-2 px-2 py-1 font-weight-bold"
              style={{
                border: isActive ? "1px solid #0f172a" : "1px solid #e2e8f0",
                backgroundColor: isActive ? "#0f172a" : "#fff",
                color: isActive ? "#fff" : "#334155",
                fontWeight: isActive ? 600 : 400,
                minWidth: "30px",
                height: "30px",
                textAlign: "center",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setCurrentPage(() => pageNum)}
            >
              {pageNum}
            </button>
          </li>
        );
      })}
      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
        <button
          className="page-link rounded-2 px-2 py-1 d-flex align-items-center gap-1 text-dark"
          style={{ border: "1px solid #e2e8f0", backgroundColor: "#fff", height: "30px" }}
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span style={{ fontSize: "0.8rem" }}>Next</span>
          <FiChevronRight size={14} />
        </button>
      </li>
    </ul>
  );
};

export default PaginationBtn;
