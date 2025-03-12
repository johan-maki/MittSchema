
export function ProfilesTableHeader() {
  return (
    <thead>
      <tr>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
          Personal
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
          Roll
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Avdelning
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Erfarenhet
        </th>
        <th scope="col" className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell dark:text-gray-100">
          Telefon
        </th>
        <th scope="col" className="relative py-3.5 pl-3 pr-6">
          <span className="sr-only">Åtgärder</span>
        </th>
      </tr>
    </thead>
  );
}
