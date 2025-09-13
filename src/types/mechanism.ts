export interface Mechanism {
  name: string;
  init(): Promise<void>;
  execute(input: any): Promise<any>;
}