import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import PaginationBtn from "@/components/PaginationBtn";

export interface SearchableTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  cellStyle?: CSSProperties;
}

interface SearchableTableProps<T> {
  columns: SearchableTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  emptyMessage?: string;
  error?: string;
}

const SearchableTable = <T,>({
  columns,
  data,
  rowKey,
  loading,
  searchValue,
  onSearchChange,
  currentPage,
  totalPages,
  setCurrentPage,
  emptyMessage = "No matching data found",
  error,
}: SearchableTableProps<T>) => {
  return (
    <div className="container-fluid">
      <div className="my-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="searchable-table__table-wrap">
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
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    padding: "12px 16px",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-danger">
                  {error}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key} style={col.cellStyle}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  {emptyMessage}
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

export default SearchableTable;
