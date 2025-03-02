
export type Notification = {
  id: string;
  recipient_id?: string;
  recipient_type?: string;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
};
