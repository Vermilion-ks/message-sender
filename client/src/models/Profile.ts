export interface Profile {
  // Object id from mongo stored in string
  userId: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  session?: string;
  _id?: string;
}
