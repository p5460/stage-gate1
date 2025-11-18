import { getAllUsers } from "@/actions/users";
import { UsersPageWithHeader } from "@/components/admin/users-page-with-header";

export default async function UsersPage() {
  try {
    const result = await getAllUsers();

    if (!result) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">No response from server</p>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">{result.error}</p>
        </div>
      );
    }

    const users = result.users || [];
    const customRoles = result.customRoles || [];

    return <UsersPageWithHeader users={users} customRoles={customRoles} />;
  } catch (error) {
    console.error("Error in UsersPage:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          Failed to load users:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This might be due to missing database tables. Please run the database
          setup.
        </p>
      </div>
    );
  }
}
