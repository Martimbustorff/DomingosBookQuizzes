import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { PopularBook } from "@/types";
import { Book } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeaturedCarouselProps {
  books: PopularBook[];
}

export const FeaturedCarousel = ({ books }: FeaturedCarouselProps) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "start",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const topThree = books.slice(0, 3);

  const rankIcons = ["🥇", "🥈", "🥉"];

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 -ml-4 pl-4">
          {topThree.map((book, index) => (
            <div
              key={book.book_id}
              className="flex-[0_0_75%] sm:flex-[0_0_60%] md:flex-[0_0_45%] min-w-0 pl-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="glass-card relative overflow-hidden cursor-pointer h-full p-4 sm:p-6 transition-all duration-300 active:scale-95 hover:shadow-xl group"
                onClick={() => navigate(`/book/${book.book_id}`)}
              >
                {/* Rank badge with pulsing glow */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                    <div className="relative text-4xl sm:text-5xl drop-shadow-lg animate-bounce-subtle">
                      {rankIcons[index]}
                    </div>
                  </div>
                </div>

                {/* Book Cover */}
                <div className="flex justify-center mb-4 mt-8">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-32 h-48 sm:w-40 sm:h-56 object-cover rounded-lg shadow-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-32 h-48 sm:w-40 sm:h-56 bg-muted/50 rounded-lg flex items-center justify-center shadow-xl">
                      <Book className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="space-y-2 text-center">
                  <h3 className="font-bold text-lg sm:text-xl text-foreground line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                  )}
                  
                  {/* Stats */}
                  {book.quiz_count > 0 && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                      <span>👥 {book.unique_users}</span>
                      <span>•</span>
                      {book.avg_score !== null && (
                        <span className="font-semibold text-primary">
                          ⭐ {book.avg_score}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      {topThree.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {topThree.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className="w-2 h-2 rounded-full bg-muted hover:bg-primary transition-colors duration-200"
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
