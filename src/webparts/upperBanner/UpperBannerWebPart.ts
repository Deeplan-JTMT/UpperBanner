import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,

} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart, WebPartContext } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'UpperBannerWebPartStrings';
import UpperBanner from './components/UpperBanner';
import { IUpperBannerProps } from './components/IUpperBannerProps';
import getSP from '../PnPjsConfig';
import { SPFI } from "@pnp/sp";
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy, PropertyFieldNumber } from '@pnp/spfx-property-controls';

const { solution } = require("../../../config/package-solution.json");


export interface IUpperBannerWebPartProps {
  description: string;
  InterchangingBannerListId: string;
  SlideInterval: number;
  AmountOfPictures: number;
  context: WebPartContext;
}

export default class UpperBannerWebPart extends BaseClientSideWebPart<IUpperBannerWebPartProps> {

  sp: SPFI;

  public render(): void {
    const element: React.ReactElement<IUpperBannerProps> = React.createElement(
      UpperBanner,
      {
        description: this.properties.description,
        InterchangingBannerListId: this.properties.InterchangingBannerListId,
        SlideInterval: this.properties.SlideInterval,
        AmountOfPictures: this.properties.AmountOfPictures,
        sp: this.sp,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this.sp = getSP(this.context)
    return this._getEnvironmentMessage().then(message => {
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse(solution.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyFieldListPicker("InterchangingBannerListId", {
                  label: "Select Interchanging Banner List list",
                  selectedList: this.properties.InterchangingBannerListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "listPickerFieldId",
                }),
                PropertyFieldNumber("SlideInterval", {
                  key: "SlideInterval",
                  label: "Slide Interval",
                  description: "Slide Interval",
                  value: this.properties.SlideInterval,
                  disabled: false
                }),
                PropertyFieldNumber("AmountOfPictures", {
                  key: "AmountOfPictures",
                  label: "AmountOfPictures",
                  description: "Amount of pictures showen in the banner",
                  value: this.properties.AmountOfPictures,
                  disabled: false
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
