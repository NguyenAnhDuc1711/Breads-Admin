interface ComingSoonPageProps {
  title: string;
}

const ComingSoonPage = ({ title }: ComingSoonPageProps) => {
  return (
    <div className="container-fluid py-4">
      <h2>{title}</h2>
      <p className="text-muted">Khu vực này đang được xây dựng.</p>
    </div>
  );
};

export default ComingSoonPage;
