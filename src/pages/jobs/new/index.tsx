import { HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useTechnicians } from "@/hooks/use-technicians";
import { JobForm } from "../job-form";

const NewJob = () => {
  const { data: technicians, isLoading } = useTechnicians();

  if (!isLoading && (!technicians || technicians.length === 0)) {
    return (
      <div className="space-y-6">
        <PageHeader title="新增場次" />
        <EmptyState
          icon={HardHat}
          title="請先建立師傅"
          description="場次需要指定一位負責師傅，才能自動帶入工資。"
          action={
            <Button asChild>
              <Link to="/technicians">前往師傅管理</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="新增場次"
        description="輸入這一場的安裝項目，系統會自動帶入師傅工資與該地區油資。"
      />
      <JobForm />
    </div>
  );
};

export default NewJob;