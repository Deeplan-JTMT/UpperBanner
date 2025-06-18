import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPFI } from "@pnp/sp";

export interface IUpperBannerProps {
  description: string;
  InterchangingBannerListId: string;
  SlideInterval: number;
  AmountOfPictures: number;
  sp: SPFI;
  context: WebPartContext;
}
