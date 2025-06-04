import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

// Импорт минимального набора проверенных иконок
import {
  // Основные
  Home01Icon,
  Home02Icon,
  DashboardSpeed01Icon,
  DashboardCircleIcon,
  Menu01Icon,
  Menu02Icon,
  Cancel01Icon,
  Cancel02Icon,
  Search01Icon,
  Search02Icon,
  Settings01Icon,
  Settings02Icon,
  
  // Пользователи
  UserIcon,
  UserMultiple02Icon,
  UserAdd01Icon,
  UserRemove01Icon,
  UserEdit01Icon,
  UserCheck01Icon,
  UserBlock01Icon,
  UserStar01Icon,
  UserLove01Icon,
  UserSettings01Icon,
  UserAccountIcon,
  UserCircleIcon,
  UserSquareIcon,
  
  // Действия
  Add01Icon,
  Add02Icon,
  AddCircleIcon,
  AddSquareIcon,
  Edit01Icon,
  Edit02Icon,
  Delete01Icon,
  Delete02Icon,
  DeleteThrowIcon,
  Copy01Icon,
  Copy02Icon,
  Share01Icon,
  Share02Icon,
  Share03Icon,
  Download01Icon,
  Download02Icon,
  Upload01Icon,
  Upload02Icon,
  RefreshIcon,
  ReloadIcon,
  FilterIcon,
  FilterHorizontalIcon,
  SortingAZ01Icon,
  SortingZA01Icon,
  
  // Файлы
  File01Icon,
  File02Icon,
  FileAudioIcon,
  FileVideoIcon,
  FileEditIcon,
  FileZipIcon,
  CssFile01Icon,
  Folder01Icon,
  Folder02Icon,
  Image01Icon,
  Image02Icon,
  Video01Icon,
  Video02Icon,
  Pdf01Icon,
  Pdf02Icon,
  
  // Веб
  Globe02Icon,
  Link01Icon,
  Link02Icon,
  BrowserIcon,
  CodeIcon,
  CodeCircleIcon,
  ApiIcon,
  Database01Icon,
  Database02Icon,
  
  // Коммуникация
  Mail01Icon,
  Mail02Icon,
  MailAdd01Icon,
  MailRemove01Icon,
  MailSend01Icon,
  Message01Icon,
  Message02Icon,
  MessageAdd01Icon,
  MessageEdit01Icon,
  Notification01Icon,
  Notification02Icon,
  NotificationOff01Icon,
  NotificationBlock01Icon,
  
  // Медиа
  PlayIcon,
  PlayCircleIcon,
  PlaySquareIcon,
  PauseIcon,
  StopIcon,
  PreviousIcon,
  NextIcon,
  ForwardIcon,
  BackwardIcon,
  Camera01Icon,
  Camera02Icon,
  CameraAdd01Icon,
  CameraOff01Icon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
  
  // Статус
  CheckmarkCircle01Icon,
  CheckmarkSquare01Icon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
  AlertSquareIcon,
  Alert01Icon,
  Alert02Icon,
  InformationCircleIcon,
  InformationSquareIcon,
  HelpCircleIcon,
  HelpSquareIcon,
  
  // Стрелки
  ArrowUp01Icon,
  ArrowUp02Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUpLeft01Icon,
  ArrowUpRight01Icon,
  ArrowDownLeft01Icon,
  ArrowDownRight01Icon,
  ArrowExpand01Icon,
  ArrowExpand02Icon,
  ArrowShrink01Icon,
  ArrowReloadHorizontalIcon,
  ArrowReloadVerticalIcon,
  
  // Время
  Calendar01Icon,
  Calendar02Icon,
  Calendar03Icon,
  CalendarAdd01Icon,
  CalendarCheckIn01Icon,
  CalendarCheckOut01Icon,
  CalendarBlock01Icon,
  CalendarLock01Icon,
  Clock01Icon,
  Clock02Icon,
  AlarmClockIcon,
  Timer01Icon,
  Timer02Icon,
  
  // Безопасность
  LockIcon,
  LockPasswordIcon,
  LockKeyIcon,
  KeyIcon,
  Key01Icon,
  ViewIcon,
  ViewOffIcon,
  SecurityIcon,
  ShieldIcon,
  Shield01Icon,
  
  // Финансы
  CreditCardIcon,
  Money01Icon,
  Money02Icon,
  MoneyAdd01Icon,
  MoneyRemove01Icon,
  PaymentSuccess01Icon,
  PaymentSuccess02Icon,
  ShoppingCart01Icon,
  ShoppingCart02Icon,
  
  // Социальные
  FavouriteIcon,
  StarIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  
  // Местоположение
  Location01Icon,
  Location02Icon,
  LocationAdd01Icon,
  LocationRemove01Icon,
  MapsIcon,
  NavigationIcon,
  Navigation01Icon,
  CompassIcon,
  Compass01Icon,
  
  // Системные
  FireIcon,
  WifiIcon,
  Wifi01Icon,
  BluetoothIcon,
  PrinterIcon,
  
  // Авторизация
  LogoutIcon,
  Logout01Icon,
  LoginIcon,
  Login01Icon,
  
  // Дополнительные
  BookIcon,
  Book01Icon,
  ContactIcon,
  Contact01Icon,
  TagIcon,
  Tag01Icon,
  Flag01Icon,
  Flag02Icon,
  SunIcon,
  Sun01Icon,
  MoonIcon,
  Moon01Icon,
  PaintBrushIcon,
  
  // Состояния
  Loading01Icon,
  Loading02Icon,
  Loading03Icon,
  
} from '@hugeicons/core-free-icons';

// Типы для размеров иконок
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray' | 'white' | 'current';

// Мапинг размеров в пиксели
const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Мапинг цветов
const colorMap: Record<IconColor, string> = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  gray: '#9CA3AF',
  white: '#FFFFFF',
  current: 'currentColor',
};

// ПРОВЕРЕННЫЙ мапинг названий иконок к компонентам
export const iconMap = {
  // Основные навигационные
  home: Home01Icon,
  homeAlt: Home02Icon,
  dashboard: DashboardSpeed01Icon,
  dashboardCircle: DashboardCircleIcon,
  menu: Menu01Icon,
  menuAlt: Menu02Icon,
  close: Cancel01Icon,
  closeAlt: Cancel02Icon,
  search: Search01Icon,
  searchAlt: Search02Icon,
  settings: Settings01Icon,
  settingsAlt: Settings02Icon,
  
  // Пользователи
  user: UserIcon,
  users: UserMultiple02Icon,
  userAdd: UserAdd01Icon,
  userRemove: UserRemove01Icon,
  userEdit: UserEdit01Icon,
  userCheck: UserCheck01Icon,
  userBlock: UserBlock01Icon,
  userStar: UserStar01Icon,
  userLove: UserLove01Icon,
  userSettings: UserSettings01Icon,
  userAccount: UserAccountIcon,
  userCircle: UserCircleIcon,
  userSquare: UserSquareIcon,
  
  // Действия
  add: Add01Icon,
  addAlt: Add02Icon,
  addCircle: AddCircleIcon,
  addSquare: AddSquareIcon,
  edit: Edit01Icon,
  editAlt: Edit02Icon,
  delete: Delete01Icon,
  deleteAlt: Delete02Icon,
  deleteThrow: DeleteThrowIcon,
  copy: Copy01Icon,
  copyAlt: Copy02Icon,
  share: Share01Icon,
  shareAlt: Share02Icon,
  shareAdvanced: Share03Icon,
  download: Download01Icon,
  downloadAlt: Download02Icon,
  upload: Upload01Icon,
  uploadAlt: Upload02Icon,
  refresh: RefreshIcon,
  reload: ReloadIcon,
  filter: FilterIcon,
  filterHorizontal: FilterHorizontalIcon,
  sortAZ: SortingAZ01Icon,
  sortZA: SortingZA01Icon,
  
  // Файлы
  file: File01Icon,
  fileAlt: File02Icon,
  fileAudio: FileAudioIcon,
  fileVideo: FileVideoIcon,
  fileText: FileEditIcon,
  fileZip: FileZipIcon,
  fileCSS: CssFile01Icon,
  folder: Folder01Icon,
  folderAlt: Folder02Icon,
  image: Image01Icon,
  imageAlt: Image02Icon,
  video: Video01Icon,
  videoAlt: Video02Icon,
  pdf: Pdf01Icon,
  pdfAlt: Pdf02Icon,
  
  // Веб
  globe: Globe02Icon,
  link: Link01Icon,
  linkAlt: Link02Icon,
  browser: BrowserIcon,
  code: CodeIcon,
  codeCircle: CodeCircleIcon,
  api: ApiIcon,
  database: Database01Icon,
  databaseAlt: Database02Icon,
  
  // Коммуникация
  mail: Mail01Icon,
  mailAlt: Mail02Icon,
  mailAdd: MailAdd01Icon,
  mailRemove: MailRemove01Icon,
  mailSend: MailSend01Icon,
  message: Message01Icon,
  messageAlt: Message02Icon,
  messageAdd: MessageAdd01Icon,
  messageEdit: MessageEdit01Icon,
  notification: Notification01Icon,
  notificationAlt: Notification02Icon,
  notificationOff: NotificationOff01Icon,
  notificationBlock: NotificationBlock01Icon,
  
  // Медиа
  play: PlayIcon,
  playCircle: PlayCircleIcon,
  playSquare: PlaySquareIcon,
  pause: PauseIcon,
  stop: StopIcon,
  previous: PreviousIcon,
  next: NextIcon,
  fastForward: ForwardIcon,
  fastBackward: BackwardIcon,
  camera: Camera01Icon,
  cameraAlt: Camera02Icon,
  cameraAdd: CameraAdd01Icon,
  cameraOff: CameraOff01Icon,
  volumeHigh: VolumeHighIcon,
  volumeLow: VolumeLowIcon,
  volumeOff: VolumeOffIcon,
  
  // Статус
  check: CheckmarkCircle01Icon,
  checkSquare: CheckmarkSquare01Icon,
  checkmark: CheckmarkBadge01Icon,
  cancel: Cancel02Icon,
  alert: AlertCircleIcon,
  alertSquare: AlertSquareIcon,
  alertBasic: Alert01Icon,
  alertAlt: Alert02Icon,
  info: InformationCircleIcon,
  infoSquare: InformationSquareIcon,
  question: HelpCircleIcon,
  questionSquare: HelpSquareIcon,
  warning: Alert01Icon,
  
  // Стрелки
  arrowUp: ArrowUp01Icon,
  arrowUpAlt: ArrowUp02Icon,
  arrowDown: ArrowDown01Icon,
  arrowDownAlt: ArrowDown02Icon,
  arrowLeft: ArrowLeft01Icon,
  arrowLeftAlt: ArrowLeft02Icon,
  arrowRight: ArrowRight01Icon,
  arrowRightAlt: ArrowRight02Icon,
  arrowUpLeft: ArrowUpLeft01Icon,
  arrowUpRight: ArrowUpRight01Icon,
  arrowDownLeft: ArrowDownLeft01Icon,
  arrowDownRight: ArrowDownRight01Icon,
  expand: ArrowExpand01Icon,
  expandAlt: ArrowExpand02Icon,
  shrink: ArrowShrink01Icon,
  reloadHorizontal: ArrowReloadHorizontalIcon,
  reloadVertical: ArrowReloadVerticalIcon,
  
  // Время
  calendar: Calendar01Icon,
  calendarAlt: Calendar02Icon,
  calendarComplex: Calendar03Icon,
  calendarAdd: CalendarAdd01Icon,
  calendarCheckIn: CalendarCheckIn01Icon,
  calendarCheckOut: CalendarCheckOut01Icon,
  calendarBlock: CalendarBlock01Icon,
  calendarLock: CalendarLock01Icon,
  clock: Clock01Icon,
  clockAlt: Clock02Icon,
  alarmClock: AlarmClockIcon,
  timer: Timer01Icon,
  timerAlt: Timer02Icon,
  
  // Безопасность
  lock: LockIcon,
  lockPassword: LockPasswordIcon,
  lockKey: LockKeyIcon,
  key: KeyIcon,
  keyAlt: Key01Icon,
  eye: ViewIcon,
  eyeOff: ViewOffIcon,
  security: SecurityIcon,
  shield: ShieldIcon,
  shieldAlt: Shield01Icon,
  
  // Финансы
  creditCard: CreditCardIcon,
  money: Money01Icon,
  moneyAlt: Money02Icon,
  moneyAdd: MoneyAdd01Icon,
  moneyRemove: MoneyRemove01Icon,
  paymentSuccess: PaymentSuccess01Icon,
  paymentSuccessAlt: PaymentSuccess02Icon,
  cart: ShoppingCart01Icon,
  cartAlt: ShoppingCart02Icon,
  
  // Социальные
  favourite: FavouriteIcon,
  star: StarIcon,
  thumbsUp: ThumbsUpIcon,
  thumbsDown: ThumbsDownIcon,
  
  // Местоположение
  location: Location01Icon,
  locationAlt: Location02Icon,
  locationAdd: LocationAdd01Icon,
  locationRemove: LocationRemove01Icon,
  map: MapsIcon,
  navigation: NavigationIcon,
  navigationAlt: Navigation01Icon,
  compass: CompassIcon,
  compassAlt: Compass01Icon,
  
  // Системные
  fire: FireIcon,
  wifi: WifiIcon,
  wifiAlt: Wifi01Icon,
  bluetooth: BluetoothIcon,
  printer: PrinterIcon,
  
  // Авторизация
  logout: LogoutIcon,
  logoutAlt: Logout01Icon,
  login: LoginIcon,
  loginAlt: Login01Icon,
  
  // Дополнительные
  book: BookIcon,
  bookAlt: Book01Icon,
  contact: ContactIcon,
  contactAlt: Contact01Icon,
  tag: TagIcon,
  tagAlt: Tag01Icon,
  flag: Flag01Icon,
  flagAlt: Flag02Icon,
  sun: SunIcon,
  sunAlt: Sun01Icon,
  moon: MoonIcon,
  moonAlt: Moon01Icon,
  paintBrush: PaintBrushIcon,
  
  // Состояния
  loading: Loading01Icon,
  loadingDots: Loading02Icon,
  loadingBars: Loading03Icon,
};

export type AvailableIconName = keyof typeof iconMap;

export interface IconProps {
  /** Название иконки */
  name: AvailableIconName;
  /** Размер иконки */
  size?: IconSize;
  /** Цвет иконки */
  color?: IconColor;
  /** Толщина обводки */
  strokeWidth?: number;
  /** Дополнительные CSS классы */
  className?: string;
  /** Обработчик клика */
  onClick?: () => void;
  /** Заголовок для доступности */
  title?: string;
}

/**
 * Универсальный компонент иконки на основе HugeIcons
 */
const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'current',
  strokeWidth = 1.5,
  className = '',
  onClick,
  title,
}) => {
  const iconComponent = iconMap[name];
  
  if (!iconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return (
      <div 
        className={`inline-flex items-center justify-center text-gray-400 ${className}`}
        style={{ width: sizeMap[size], height: sizeMap[size] }}
        title={title || `Icon ${name} not found`}
      >
        ?
      </div>
    );
  }

  const iconSize = sizeMap[size];
  const iconColor = colorMap[color];

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onClick={onClick}
      title={title}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <HugeiconsIcon
        icon={iconComponent}
        size={iconSize}
        color={iconColor}
        strokeWidth={strokeWidth}
      />
    </div>
  );
};

export default Icon; 