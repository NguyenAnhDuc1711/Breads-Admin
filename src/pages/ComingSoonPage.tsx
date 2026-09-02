interface ComingSoonPageProps {
  title: string;
}

const ComingSoonPage = ({ title }: ComingSoonPageProps) => {
  return (
    <div className="container-fluid py-4">
      <h2>{title}</h2>
      <p className="text-muted">This area is under construction.</p>
    </div>
  );
};

export default ComingSoonPage;
