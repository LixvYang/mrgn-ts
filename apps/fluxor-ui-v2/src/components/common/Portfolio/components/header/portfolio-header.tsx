import { PageHeading } from "~/components/common/PageHeading";

export const PortfolioHeader = () => {
  return (
    <PageHeading
      heading="Portfolio"
      body={
        <div className="space-y-6">
          <p>Manage your fluxor positions.</p>
        </div>
      }
    />
  );
};
