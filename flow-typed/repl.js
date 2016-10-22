declare module "repl" {
  declare type REPL = {
    context: Object,
    on: (event: string, callback: () => void) => void;
  };
  declare function start(prompt: string): REPL;
}
