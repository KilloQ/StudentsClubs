type SeoProps = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    type?: "website" | "article";
  };
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

export function Seo({
  title,
  description,
  canonicalUrl,
  openGraph,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const og = openGraph ?? {};
  const ogTitle = og.title ?? title;
  const ogDescription = og.description ?? description;
  const ogType = og.type ?? "website";
  const upsertMeta = (selector: string, attrs: Record<string, string>) => {
    let el = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  };

  const upsertLink = (rel: string, href: string) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  };

  const upsertJsonLd = (data: Record<string, unknown>) => {
    const id = "jsonld-primary";
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  };

  if (typeof document !== "undefined") {
    document.title = title;
    if (description) upsertMeta('meta[name="description"]', { name: "description", content: description });
    if (canonicalUrl) upsertLink("canonical", canonicalUrl);
    if (noindex) upsertMeta('meta[name="robots"]', { name: "robots", content: "noindex, nofollow" });

    upsertMeta('meta[property="og:type"]', { property: "og:type", content: ogType });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: ogTitle });
    if (ogDescription) upsertMeta('meta[property="og:description"]', { property: "og:description", content: ogDescription });
    if (og.url) upsertMeta('meta[property="og:url"]', { property: "og:url", content: og.url });
    if (og.image) upsertMeta('meta[property="og:image"]', { property: "og:image", content: og.image });

    if (jsonLd) upsertJsonLd(jsonLd);
  }

  return null;
}

