import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateGroupChatMutation } from '@/services/chatApi';
import { useSearchUsersQuery } from '@/services/userApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, UsersRound, X } from 'lucide-react';
import type { User } from '@/types/entities';

export function CreateGroupDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const debouncedQuery = useDebounce(query, 400);
  const { data } = useSearchUsersQuery(debouncedQuery, { skip: debouncedQuery.length < 2 });
  const [createGroup, { isLoading }] = useCreateGroupChatMutation();

  const addUser = (user: User): void => {
    if (selectedUsers.some((u) => u._id === user._id)) return;
    setSelectedUsers((prev) => [...prev, user]);
  };

  const removeUser = (id: string): void => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== id));
  };

  const handleCreate = async (): Promise<void> => {
    if (!name.trim() || selectedUsers.length < 2) {
      toast.error('Group needs a name and at least 2 members');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      selectedUsers.forEach((user) => formData.append('participantIds', user._id));

      await createGroup(formData).unwrap();
      toast.success('Group created');
      setOpen(false);
      setName('');
      setDescription('');
      setSelectedUsers([]);
      setQuery('');
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Failed to create group';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='secondary'>
          <PlusCircle className='h-4 w-4' />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>Start a focused room for your team or community.</DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Group name' />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Description (optional)'
          />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search users by name/email'
          />

          <div className='flex flex-wrap gap-2'>
            {selectedUsers.map((user) => (
              <Badge key={user._id} variant='secondary' className='flex items-center gap-2 py-1'>
                <span>{user.name}</span>
                <button onClick={() => removeUser(user._id)} aria-label='Remove user'>
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>

          <div className='max-h-48 space-y-2 overflow-auto rounded-lg border p-2'>
            {(data?.data ?? []).map((user) => (
              <button
                key={user._id}
                onClick={() => addUser(user)}
                className='flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted'
              >
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    <UsersRound className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>{user.name}</p>
                  <p className='text-xs text-muted-foreground'>{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
