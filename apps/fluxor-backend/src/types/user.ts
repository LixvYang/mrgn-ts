export interface ComputerUser {
  id: number;
  mixin_user_id: string;
  mix_address: string;
  computer_user_id: string;
  chain_address: string;
  created_at: Date;
  updated_at: Date;
}

export interface MixinUser {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}