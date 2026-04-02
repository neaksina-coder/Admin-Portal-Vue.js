import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import hr from './hr'
import others from './others'
import uiElements from './ui-elements'
import type { VerticalNavItems } from '@layouts/types'

export default [...dashboard, ...appsAndPages, ...hr, ...uiElements, ...forms, ...charts, ...others] as VerticalNavItems
