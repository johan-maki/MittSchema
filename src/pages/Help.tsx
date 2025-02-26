
import { AppLayout } from "@/components/AppLayout";

const Help = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Hjälp</h1>
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Kom igång</h2>
            <p className="text-gray-600 mb-4">
              Välkommen till hjälpsektionen för Vårdschema. Här hittar du information om hur du använder systemet.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Help;
