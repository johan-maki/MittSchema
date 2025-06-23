
export function ProfilesTableHeader() {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800/50">
      <tr>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
          Personal
        </th>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
          Roll
        </th>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
          Avdelning
        </th>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
          Erfarenhet
        </th>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
          Telefon
        </th>
        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
          Timlön
        </th>
        <th scope="col" className="relative py-4 pl-3 pr-6">
          <span className="sr-only">Åtgärder</span>
        </th>
      </tr>
    </thead>
  );
}
