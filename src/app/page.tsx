import { Hero } from "@/features/home/Hero";
import { ServicesGrid } from "@/features/home/ServicesGrid";
import { ProcessTimeline } from "@/features/home/ProcessTimeline";
import { FeaturedProjects } from "@/features/home/FeaturedProjects";
import { FeaturedCars } from "@/features/home/FeaturedCars";
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
  getVisibleCars,
} from "@/lib/content/queries";
import { getLoggedInProfile } from "@/lib/account/getLoggedInProfile";
import { isCurrentUserNewsletterSubscriber } from "@/actions/newsletter";

export default async function HomePage() {
  const [settings, services, projects, cars, galleries, videos, products, loggedIn, isNewsletterSubscriber] =
    await Promise.all([
      getSiteSettings(),
      getServices(),
      getFeaturedProjects(3),
      getVisibleCars(3),
      getGalleries(),
      getFeaturedVideos(),
      getFeaturedProducts(),
      getLoggedInProfile(),
      isCurrentUserNewsletterSubscriber(),
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
      <FeaturedCars cars={cars} />
      <GalleriesShowcase galleries={galleries} />
      <WorkshopVideos videos={videos} settings={settings} />
      <FeaturedShop products={products} />
      <NewsletterCta hideNewsletterCta={isNewsletterSubscriber} />
      <ContactSection settings={settings} initialValues={contactInitialValues} />
    </>
  );
}
