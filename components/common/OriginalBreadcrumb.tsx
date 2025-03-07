import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BreadcrumbProps {
  items: {
    label: string;
    href: string;
  }[];
}

export function OriginalBreadcrumb({ items }: BreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index !== items.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
            {index !== items.length - 1 && ">"}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
