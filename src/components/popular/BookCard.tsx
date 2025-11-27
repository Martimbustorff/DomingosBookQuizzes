import { PopularBook } from "@/types";
import { Book } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: PopularBook;
  index: number;
}

// Colorful rank badge colors (top 10 get special colors)
const getRankColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
  if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white";
  if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white";
  if (rank <= 10) return "bg-gradient-to-br from-primary to-accent text-primary-foreground";
  return "bg-muted text-muted-foreground";
};

export const BookCard = ({ book, index }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-95 overflow-hidden animate-fade-in group relative"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/book/${book.book_id}`)}
    >
      {/* Rank Badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge 
          className={`${getRankColor(book.ranking)} shadow-md font-bold text-xs px-2 py-0.5 min-w-[28px] justify-center`}
        >
          #{book.ranking}
        </Badge>
      </div>

      {/* Book Cover */}
      <div className="relative w-full aspect-[3/4] bg-muted">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {book.author}
            </p>
          )}
        </div>

        {/* Compact Stats with Emojis */}
        {book.quiz_count > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5">
              📖 <span className="font-semibold text-foreground">{book.quiz_count}</span>
            </span>
            <span className="flex items-center gap-0.5">
              👥 <span className="font-semibold text-foreground">{book.unique_users}</span>
            </span>
            {book.avg_score !== null && (
              <span className="flex items-center gap-0.5 text-primary font-bold">
                ⭐ {book.avg_score}%
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
