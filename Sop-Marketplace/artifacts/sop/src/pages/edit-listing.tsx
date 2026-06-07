import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetListing,
  getGetListingQueryKey,
  useUpdateListing,
  getGetMyListingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Clothing", "Shoes", "Accessories", "Electronics", "Books", "Sports", "Home", "Art", "Music", "Other"];

const formSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0.01),
  category: z.string().min(1),
  status: z.enum(["available", "sold"]),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditListingPage() {
  const [, params] = useRoute("/dashboard/listings/:id/edit");
  const id = params?.id ?? "";
  const [, setLocation] = useLocation();
  const updateListing = useUpdateListing();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [preview, setPreview] = useState("");

  const { data: listing, isLoading } = useGetListing(id, {
    query: { enabled: !!id, queryKey: getGetListingQueryKey(id) },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: "",
      status: "available",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (listing) {
      const img = listing.images?.[0] ?? "";
      form.reset({
        title: listing.title,
        description: listing.description ?? "",
        price: listing.price,
        category: listing.category,
        status: listing.status as "available" | "sold",
        imageUrl: img,
      });
      setPreview(img);
    }
  }, [listing, form]);

  function onSubmit(values: FormValues) {
    const images = values.imageUrl ? [values.imageUrl] : [];
    updateListing.mutate(
      {
        id,
        data: {
          title: values.title,
          description: values.description,
          price: values.price,
          category: values.category,
          status: values.status,
          images,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
          toast({ title: "Listing updated" });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({ title: "Failed to update", description: err?.message, variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard" data-testid="link-back-dashboard">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">Edit listing</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Image preview */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {preview && (
                          <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                            <img
                              src={preview}
                              alt="Preview"
                              className="h-full w-full object-contain"
                              onError={() => setPreview("")}
                              data-testid="img-preview"
                            />
                          </div>
                        )}
                        <Input
                          placeholder="https://example.com/photo.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPreview(e.target.value);
                          }}
                          data-testid="input-image-url"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input type="number" step="0.01" className="pl-6" {...field} data-testid="input-price" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" data-testid="button-cancel">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateListing.isPending}
                  data-testid="button-submit"
                >
                  {updateListing.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
