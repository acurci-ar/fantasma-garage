import { Hero } from "@/features/home/Hero";
import { ServicesGrid } from "@/features/home/ServicesGrid";
import { ProcessTimeline } from "@/features/home/ProcessTimeline";
import { FeaturedProjects } from "@/features/home/FeaturedProjects";
import { GalleriesShowcase } from "@/features/home/GalleriesShowcase";
import { WorkshopVideos } from "@/features/home/WorkshopVideos";
import { FeaturedShop } from "@/features/home/FeaturedShop";
import { NewsletterCta } from "@/features/home/NewsletterCta";
import { ContactSection } from "@/features/home/ContactSection";
import {
  getFeaturedProducts,
  getFeaturedProjects,
  getFeaturedVideos,
  getGalleries,
  getServices,
  getSiteSettings,
} from "@/lib/content/queries";
import { getLoggedInProfile } from "@/lib/account/getLoggedInProfile";

export default async function HomePage() {
  const [settings, services, projects, galleries, videos, products, loggedIn] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getFeaturedProjects(),
    getGalleries(),
    getFeaturedVideos(),
    getFeaturedProducts(),
    getLoggedInProfile(),
  ]);
  const contactInitialValues = loggedIn
    ? { name: loggedIn.profile?.full_name ?? "", email: loggedIn.email, phone: loggedIn.profile?.phone ?? "" }
    : undefined;

  return (
    <>
      <Hero settings={settings} />
      <ServicesGrid services={services} />
      <ProcessTimeline />
      <FeaturedProjects projects={projects} />
      <GalleriesShowcase galleries={galleries} />
      <WorkshopVideos videos={videos} settings={settings} />
      <FeaturedShop products={products} />
      <NewsletterCta />
      <ContactSection settings={settings} initialValues={contactInitialValues} />
    </>
  );
}
