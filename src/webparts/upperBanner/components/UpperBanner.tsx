import * as React from "react";
import styles from "./UpperBanner.module.scss";
import type { IUpperBannerProps } from "./IUpperBannerProps";
import {
  Carousel,
  CarouselButtonsDisplay,
  CarouselButtonsLocation,
  CarouselIndicatorShape,
  CarouselIndicatorsDisplay,
} from "@pnp/spfx-controls-react";
import { ImageFit } from "@fluentui/react";

export interface Link {
  Description: string;
  Url: string;
}

export interface IUpperBannerStates {
  Banner: any[];
  CurrNewIndex: number;
}

const btnStyle: { [key: string]: React.CSSProperties } = {
  promAlert: {
    display: "none",
  },
};
export default class UpperBanner extends React.Component<
  IUpperBannerProps,
  IUpperBannerStates
> {
  constructor(props: IUpperBannerProps) {
    super(props);
    this.state = {
      Banner: [],
      CurrNewIndex: 0,
    };
  }

  componentDidMount(): void {
    this.getBenner();
    window.addEventListener(
      "scroll",
      function (e) {
        e.stopImmediatePropagation(); // Prevent all scroll-related events from propagating.
      },
      true
    );
  }

  // Get the list items
  getBenner = async () => {
    try {
      const banner = await this.props.sp.web.lists.getById(this.props.InterchangingBannerListId).items
        .select("Id", "Title", "link", "sortOrderShow", "isDisplay", "properties", "File/ServerRelativeUrl")
        .orderBy("sortOrderShow")
        .filter(`isDisplay ne 'false'`)
        .expand("File")
        .top(this.props.AmountOfPictures)();

      let elements = banner.map((b: any) => ({
        imageSrc: b.File.ServerRelativeUrl,
        title: b?.Title,
        url: b?.link?.Url || "",
        showDetailsOnHover: true,
        imageFit: ImageFit.cover,
        detailsStyle: btnStyle.promAlert,
        id: b?.Id,
        onClick: () => this.onBannerClick(b?.link?.Url || ""),
      }));

      this.setState({ Banner: elements });
      return banner;
    } catch (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }
  };

  onBannerClick = (url: string) => {
    window.open(url, "_blank");
  };

  onPictureConverterUrl = (imageFromSP: any, id: number): string => {
    const imageUrl =
      JSON.parse(imageFromSP)?.serverUrl +
      JSON.parse(imageFromSP)?.serverRelativeUrl;
    return imageUrl;
  };

  // Add this method to handle the prev button click
  handlePrevClick = (): void => {
    this.setState((prevState) => ({
      CurrNewIndex:
        prevState.CurrNewIndex > 0
          ? prevState.CurrNewIndex - 1
          : prevState.Banner.length - 1,
    }));
  };

  // Add this method to handle the next button click
  handleNextClick = (): void => {
    this.setState((prevState) => ({
      CurrNewIndex:
        prevState.CurrNewIndex < prevState.Banner.length - 1
          ? prevState.CurrNewIndex + 1
          : 0,
    }));
  };

  public render(): React.ReactElement<IUpperBannerProps> {
    return (
      <section dir="ltr">
        <Carousel
          buttonsLocation={CarouselButtonsLocation.center}
          buttonsDisplay={CarouselButtonsDisplay.buttonsOnly}
          indicatorShape={CarouselIndicatorShape.rectangle}
          indicatorsDisplay={CarouselIndicatorsDisplay.overlap}
          indicatorStyle={{ backgroundColor: "#e5eaee" }}
          isInfinite={true}
          pauseOnHover={true}
          containerStyles={styles.Container}
          containerButtonsStyles={styles.Buttons}
          prevButtonStyles={styles.Buttons}
          nextButtonStyles={styles.Buttons}
          interval={this.props.SlideInterval}
          element={this.state.Banner}
          onMoveNextClicked={() => this.handleNextClick()}
          onMovePrevClicked={() => this.handlePrevClick()}
          elementsCount={this.props.AmountOfPictures}
          slide
        />
      </section>
    );
  }
}
