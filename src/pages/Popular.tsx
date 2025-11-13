import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Book } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Popular = () => {
  const navigate = useNavigate();

  const { data: popularBooks, isLoading } = useQuery({
    queryKey: ["popular-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_books")
        .select(`
          *,
          books (*)
        `)
        .order("ranking", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-accent/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-4xl font-bold gradient-text">⭐ Popular books</h1>
        </div>

        <p className="text-muted-foreground text-xl font-medium">
          Books that kids love reading!
        </p>

        {/* Books List */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex gap-6">
                  <div className="w-16 h-20 bg-muted rounded-[12px]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded-[12px] w-3/4" />
                    <div className="h-4 bg-muted rounded-[12px] w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {popularBooks && popularBooks.length > 0 && (
          <div className="space-y-6">
            {popularBooks.map((item: any, index: number) => {
              const book = item.books;
              return (
                <Card
                  key={item.id}
                  className="p-6 cursor-pointer card-lift quiz-button animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                      {item.ranking}
                    </div>
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-20 h-24 object-cover rounded-[12px] shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-24 bg-secondary/30 rounded-[12px] flex items-center justify-center">
                        <Book className="h-10 w-10 text-secondary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-1">{book.title}</h3>
                      {book.author && (
                        <p className="text-muted-foreground font-medium">by {book.author}</p>
                      )}
                      {item.typical_grade && (
                        <p className="text-sm text-muted-foreground mt-2 font-medium">
                          {item.typical_grade}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!popularBooks || popularBooks.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground font-medium">
              No popular books available yet. Check back soon! 📚
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Popular;