import { Button } from "@/components/ui/button";

export type FilterType = "all" | "hot" | "top-rated" | "most-read";

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters = [
  { id: "all" as FilterType, label: "🌟 All", description: "All books" },
  { id: "hot" as FilterType, label: "🔥 Hot", description: "Most popular" },
  { id: "top-rated" as FilterType, label: "⭐ Top Rated", description: "Highest scores" },
  { id: "most-read" as FilterType, label: "📚 Most Read", description: "Most quizzes" },
];

export const FilterChips = ({ activeFilter, onFilterChange }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`flex-shrink-0 rounded-full min-h-[44px] px-4 transition-all duration-200 ${
            activeFilter === filter.id 
              ? "shadow-md scale-105" 
              : "hover:scale-105"
          }`}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};
