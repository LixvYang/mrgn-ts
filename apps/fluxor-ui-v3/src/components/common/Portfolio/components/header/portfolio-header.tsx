import { PageHeading } from "~/components/common/PageHeading";

export const PortfolioHeader = () => {
  return (
    <PageHeading
      heading="投资组合"
      body={
        <div className="space-y-6">
          <p>管理你的投资组合.</p>
        </div>
      }
    />
  );
};
