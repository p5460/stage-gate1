"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Users, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addProjectMember } from "@/actions/projects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const addMemberSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.string().min(1, "Please specify a role"),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  availableUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    department: string | null;
  }>;
}

export function AddMemberForm({
  open,
  onOpenChange,
  projectId,
  availableUsers,
}: AddMemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const [userOpen, setUserOpen] = useState(false);

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: "",
      role: "",
    },
  });

  const onSubmit = (data: AddMemberFormData) => {
    startTransition(async () => {
      const result = await addProjectMember(projectId, data.userId, data.role);

      if (result.success) {
        toast.success("Team member added successfully!");
        form.reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to add team member");
      }
    });
  };

  const roleOptions = [
    "Senior Researcher",
    "Researcher",
    "Technical Lead",
    "Developer",
    "Analyst",
    "Project Coordinator",
    "Quality Assurance",
    "Technical Writer",
    "Subject Matter Expert",
    "Consultant",
  ];

  const selectedUser = availableUsers.find(
    (user) => user.id === form.watch("userId")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Add a new member to the project team
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Select User *</FormLabel>
                  <Popover open={userOpen} onOpenChange={setUserOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? availableUsers.find(
                                (user) => user.id === field.value
                              )?.name ||
                              availableUsers.find(
                                (user) => user.id === field.value
                              )?.email
                            : "Select user..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {availableUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.name || user.email || ""}
                              onSelect={() => {
                                form.setValue("userId", user.id);
                                setUserOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.name || user.email}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {user.role.replace(/_/g, " ")} •{" "}
                                  {user.department}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Search and select a user to add to the project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedUser && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedUser.name || selectedUser.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedUser.role.replace(/_/g, " ")} •{" "}
                      {selectedUser.department}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Role *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Specify the role this person will have in the project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Users className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
