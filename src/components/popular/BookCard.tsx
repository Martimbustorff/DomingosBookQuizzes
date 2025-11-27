import { PopularBook } from "@/types";
import { Book } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface BookCardProps {
  book: PopularBook;
  index: number;
}

export const BookCard = ({ book, index }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="p-4 cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-[0.98] overflow-hidden animate-fade-in group"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/book/${book.book_id}`)}
    >
      <div className="flex gap-4">
        {/* Ranking Badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-base shadow-md">
          {book.ranking}
        </div>

        {/* Book Cover */}
        <div className="flex-shrink-0">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-20 h-28 sm:w-24 sm:h-32 bg-muted rounded-lg flex items-center justify-center shadow-md">
              <Book className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
                {book.author}
              </p>
            )}
          </div>

          {/* Visual Stats Bars */}
          {book.quiz_count > 0 && (
            <div className="space-y-2 pt-1">
              {/* Quizzes Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">🎯 Quizzes</span>
                  <span className="font-semibold text-foreground">{book.quiz_count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 animate-fill-bar"
                    style={{ 
                      width: `${Math.min((book.quiz_count / 10) * 100, 100)}%`,
                      animationDelay: `${index * 50 + 100}ms`
                    }}
                  />
                </div>
              </div>

              {/* Readers Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">👥 Readers</span>
                  <span className="font-semibold text-foreground">{book.unique_users}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500 animate-fill-bar"
                    style={{ 
                      width: `${Math.min((book.unique_users / 5) * 100, 100)}%`,
                      animationDelay: `${index * 50 + 200}ms`
                    }}
                  />
                </div>
              </div>

              {/* Average Score */}
              {book.avg_score !== null && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Avg Score:</span>
                  <span className="text-sm font-bold text-primary">
                    ⭐ {book.avg_score}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
