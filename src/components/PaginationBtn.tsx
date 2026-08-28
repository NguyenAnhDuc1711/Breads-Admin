import { useMemo } from "react";

const PaginationBtn = ({
  totalPages,
  currentPage,
  setCurrentPage,
}: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
}) => {
  const displayPages = useMemo(() => {
    if (currentPage <= 5) {
      return [1, 2, 3, 4, 5];
    } else {
      let start = currentPage;
      let end = currentPage + 4;
      if (currentPage >= totalPages - 4) {
        start = totalPages - 4;
        end = totalPages;
      }
      const pagesNum: number[] = [];
      for (let page = start; page <= end; page++) {
        pagesNum.push(page);
      }
      return pagesNum;
    }
  }, [currentPage, totalPages]);

  return (
    <ul
      className="pagination"
      style={{
        marginBottom: 0,
      }}
    >
      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
        <button
          className="page-link"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
      </li>
      {displayPages.map((pageNum) => (
        <li
          key={pageNum}
          className={`page-item ${currentPage === pageNum ? "active" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => setCurrentPage(() => pageNum)}
          >
            {pageNum}
          </button>
        </li>
      ))}
      <li
        className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
      >
        <button
          className="page-link"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </li>
    </ul>
  );
};

export default PaginationBtn;
