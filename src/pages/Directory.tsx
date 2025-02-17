
import { AppLayout } from "@/components/AppLayout";

const Directory = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">Personalkatalog</h1>
          <p className="text-gray-600">Hantera ditt vårdteam och kontaktinformation</p>
        </header>

        <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-gray-600">Personalkatalogen är under utveckling. Här kommer du snart kunna hantera teammedlemmar och deras kontaktinformation.</p>
        </section>
      </div>
    </AppLayout>
  );
};

export default Directory;
