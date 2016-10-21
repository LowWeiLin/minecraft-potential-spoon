declare module "mineflayer" {

  declare type Bot = {
    username: string,
    targetDigBlock: {
      name: string
    },
    on: (event: string, callback: Function) => void,
    chat: (message: string) => void,
    activateItem: () => void,
    deactivateItem: () => void,
    attack: (target: any) => void,
    navigate: { stop: () => void },
    players: { [key: string]: any },
    inventory: { items: () => Array<any> },
    blockAt: (location: any) => any,
    entity: {
      position: {
        offset: any,
        x: any,
        y: any
      }
    },
    setControlState: (state: string, value: bool) => void,
    placeBlock: (block: any, position: any, callback: Function) => void,
    removeListener: (event: string, callback: Function) => void,
    equip: (item: number, where: string, callback: Function) => void,
    navigate: any,
  }

  declare module.exports: {
    createBot: (options: { host: string, port: number, username: string }) => Bot,
    vec3: Function,
  };
}
