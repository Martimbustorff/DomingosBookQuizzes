import { PopularBook } from "@/types";
import { Book } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeaturedCarouselProps {
  books: PopularBook[];
}

export const FeaturedCarousel = ({ books }: FeaturedCarouselProps) => {
  const navigate = useNavigate();
  const topThree = books.slice(0, 3);
  const rankIcons = ["🥇", "🥈", "🥉"];
  
  // Reorder to show gold in center: [silver, gold, bronze]
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];
  const iconOrder = [rankIcons[1], rankIcons[0], rankIcons[2]];

  return (
    <div className="flex items-end justify-center gap-2 px-2">
      {podiumOrder.map((book, visualIndex) => {
        if (!book) return null;
        
        const isGold = visualIndex === 1;
        const heightClass = isGold ? "h-40" : "h-32";
        
        return (
          <div
            key={book.book_id}
            onClick={() => navigate(`/book/${book.book_id}`)}
            className={`flex-1 cursor-pointer transition-all duration-300 active:scale-95 animate-fade-in ${
              isGold ? "scale-105" : ""
            }`}
            style={{ animationDelay: `${visualIndex * 100}ms` }}
          >
            <div className={`bg-card border-2 ${isGold ? 'border-primary/50' : 'border-border'} rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 ${heightClass} flex flex-col`}>
              {/* Medal Badge */}
              <div className={`text-center mb-2 ${isGold ? 'text-3xl' : 'text-2xl'}`}>
                <span className={isGold ? 'animate-bounce-subtle inline-block' : ''}>
                  {iconOrder[visualIndex]}
                </span>
              </div>
              
              {/* Book Cover */}
              <div className="flex justify-center mb-2 flex-1">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-14 h-20 bg-muted rounded-lg flex items-center justify-center shadow-md">
                    <Book className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Book Title */}
              <p className={`text-center font-bold text-foreground line-clamp-2 ${isGold ? 'text-xs' : 'text-[10px]'} leading-tight`}>
                {book.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
