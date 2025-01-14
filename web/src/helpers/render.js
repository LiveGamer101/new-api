import i18next from 'i18next';
import { Modal, Tag, Typography } from '@douyinfe/semi-ui';
import { copy, showSuccess } from './utils.js';

export function renderText(text, limit) {
  if (text.length > limit) {
    return text.slice(0, limit - 3) + '...';
  }
  return text;
}

/**
 * Render group tags based on the input group string
 * @param {string} group - The input group string
 * @returns {JSX.Element} - The rendered group tags
 */
export function renderGroup(group) {
  if (group === '') {
    return (
      <Tag size='large' key='default' color='orange'>
        {i18next.t('UseUserGroup')}
      </Tag>
    );
  }

  const tagColors = {
    vip: 'yellow',
    pro: 'yellow',
    svip: 'red',
    premium: 'red',
  };

  const groups = group.split(',').sort();

  return (
    <span key={group}>
      {groups.map((group) => (
        <Tag
          size='large'
          color={tagColors[group] || stringToColor(group)}
          key={group}
          onClick={async (event) => {
            event.stopPropagation();
            if (await copy(group)) {
              showSuccess(i18next.t('AlreadyCopy：') + group);
            } else {
              Modal.error({ title: t('NoneMethodCopyTo clipboard，PleaseManualCopy'), content: group });
            }
          }}
        >
          {group}
        </Tag>
      ))}
    </span>
  );
}

export function renderRatio(ratio) {
  let color = 'green';
  if (ratio > 5) {
    color = 'red';
  } else if (ratio > 3) {
    color = 'orange';
  } else if (ratio > 1) {
    color = 'blue';
  }
  return <Tag color={color}>{ratio}x {i18next.t('Multiplier')}</Tag>;
}

export const renderGroupOption = (item) => {
  const {
    disabled,
    selected,
    label,
    value,
    focused,
    className,
    style,
    onMouseEnter,
    onClick,
    empty,
    emptyContent,
    ...rest
  } = item;
  
  const baseStyle = {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: focused ? 'var(--semi-color-fill-0)' : 'transparent',
    opacity: disabled ? 0.5 : 1,
    ...(selected && {
      backgroundColor: 'var(--semi-color-primary-light-default)',
    }),
    '&:hover': {
      backgroundColor: !disabled && 'var(--semi-color-fill-1)'
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e) => {
    if (!disabled && onMouseEnter) {
      onMouseEnter(e);
    }
  };
  
  return (
    <div 
      style={baseStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Typography.Text strong type={disabled ? 'tertiary' : undefined}>
          {value}
        </Typography.Text>
        <Typography.Text type="secondary" size="small">
          {label}
        </Typography.Text>
      </div>
      {item.ratio && renderRatio(item.ratio)}
    </div>
  );
};

export function renderNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return num;
  }
}

export function renderQuotaNumberWithDigit(num, digits = 2) {
  if (typeof num !== 'number' || isNaN(num)) {
    return 0;
  }
  let displayInCurrency = localStorage.getItem('display_in_currency');
  num = num.toFixed(digits);
  if (displayInCurrency) {
    return '$' + num;
  }
  return num;
}

export function renderNumberWithPoint(num) {
  if (num === undefined)
    return '';
  num = num.toFixed(2);
  if (num >= 100000) {
    // Convert number to string to manipulate it
    let numStr = num.toString();
    // Find the position of the decimal point
    let decimalPointIndex = numStr.indexOf('.');

    let wholePart = numStr;
    let decimalPart = '';

    // If there is a decimal point, split the number into whole and decimal parts
    if (decimalPointIndex !== -1) {
      wholePart = numStr.slice(0, decimalPointIndex);
      decimalPart = numStr.slice(decimalPointIndex);
    }

    // Take the first two and last two digits of the whole number part
    let shortenedWholePart = wholePart.slice(0, 2) + '..' + wholePart.slice(-2);

    // Return the formatted number
    return shortenedWholePart + decimalPart;
  }

  // If the number is less than 100,000, return it unmodified
  return num;
}

export function getQuotaPerUnit() {
  let quotaPerUnit = localStorage.getItem('quota_per_unit');
  quotaPerUnit = parseFloat(quotaPerUnit);
  return quotaPerUnit;
}

export function renderUnitWithQuota(quota) {
  let quotaPerUnit = localStorage.getItem('quota_per_unit');
  quotaPerUnit = parseFloat(quotaPerUnit);
  quota = parseFloat(quota);
  return quotaPerUnit * quota;
}

export function getQuotaWithUnit(quota, digits = 6) {
  let quotaPerUnit = localStorage.getItem('quota_per_unit');
  quotaPerUnit = parseFloat(quotaPerUnit);
  return (quota / quotaPerUnit).toFixed(digits);
}

export function renderQuotaWithAmount(amount) {
  let displayInCurrency = localStorage.getItem('display_in_currency');
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return '$' + amount;
  } else {
    return renderUnitWithQuota(amount);
  }
}

export function renderQuota(quota, digits = 2) {
  let quotaPerUnit = localStorage.getItem('quota_per_unit');
  let displayInCurrency = localStorage.getItem('display_in_currency');
  quotaPerUnit = parseFloat(quotaPerUnit);
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return '$' + (quota / quotaPerUnit).toFixed(digits);
  }
  return renderNumber(quota);
}

export function renderModelPrice(
  inputTokens,
  completionTokens,
  modelRatio,
  modelPrice = -1,
  completionRatio,
  groupRatio,
) {
  if (modelPrice !== -1) {
    return i18next.t('ModelPrice：${{price}} * GroupMultiplier：{{ratio}} = ${{total}}', {
      price: modelPrice,
      ratio: groupRatio,
      total: modelPrice * groupRatio
    });
  } else {
    if (completionRatio === undefined) {
      completionRatio = 0;
    }
    let inputRatioPrice = modelRatio * 2.0;
    let completionRatioPrice = modelRatio * 2.0 * completionRatio;
    let price =
      (inputTokens / 1000000) * inputRatioPrice * groupRatio +
      (completionTokens / 1000000) * completionRatioPrice * groupRatio;
    return (
      <>
        <article>
          <p>{i18next.t('Prompt：${{price}} * {{ratio}} = ${{total}} / 1M tokens', {
            price: inputRatioPrice,
            ratio: groupRatio,
            total: inputRatioPrice * groupRatio
          })}</p>
          <p>{i18next.t('Complete：${{price}} * {{ratio}} = ${{total}} / 1M tokens', {
            price: completionRatioPrice,
            ratio: groupRatio,
            total: completionRatioPrice * groupRatio
          })}</p>
          <p></p>
          <p>
            {i18next.t('Prompt {{input}} tokens / 1M tokens * ${{price}} + Complete {{completion}} tokens / 1M tokens * ${{compPrice}} * Group {{ratio}} = ${{total}}', {
              input: inputTokens,
              price: inputRatioPrice,
              completion: completionTokens,
              compPrice: completionRatioPrice,
              ratio: groupRatio,
              total: price.toFixed(6)
            })}
          </p>
          <p>{i18next.t('For reference only，UsedActualButtonCostForAccurate')}</p>
        </article>
      </>
    );
  }
}

export function renderModelPriceSimple(
  modelRatio,
  modelPrice = -1,
  groupRatio,
) {
  if (modelPrice !== -1) {
    return i18next.t('Price：${{price}} * Group：{{ratio}}', {
      price: modelPrice,
      ratio: groupRatio
    });
  } else {
    return i18next.t('Model: {{ratio}} * Group: {{groupRatio}}', {
      ratio: modelRatio,
      groupRatio: groupRatio
    });
  }
}

export function renderAudioModelPrice(
  inputTokens,
  completionTokens,
  modelRatio,
  modelPrice = -1,
  completionRatio,
  audioInputTokens,
  audioCompletionTokens,
  audioRatio,
  audioCompletionRatio,
  groupRatio,
) {
  // 1 ratio = $0.002 / 1K tokens
  if (modelPrice !== -1) {
    return 'ModelPrice：$' + modelPrice + ' * GroupMultiplier：' + groupRatio + ' = $' + modelPrice * groupRatio;
  } else {
    if (completionRatio === undefined) {
      completionRatio = 0;
    }

    // try toFixed audioRatio
    audioRatio = parseFloat(audioRatio).toFixed(6);
    // Here *2 IsBecauseFor 1Multiplier=0.002Knife，Do notDelete
    let inputRatioPrice = modelRatio * 2.0;
    let completionRatioPrice = modelRatio * 2.0 * completionRatio;
    let price =
      (inputTokens / 1000000) * inputRatioPrice * groupRatio +
      (completionTokens / 1000000) * completionRatioPrice * groupRatio +
      (audioInputTokens / 1000000) * inputRatioPrice * audioRatio * groupRatio +
      (audioCompletionTokens / 1000000) * inputRatioPrice * audioRatio * audioCompletionRatio * groupRatio;
    return (
      <>
        <article>
          <p>{i18next.t('Prompt：${{price}} * {{ratio}} = ${{total}} / 1M tokens', {
            price: inputRatioPrice,
            ratio: groupRatio,
            total: inputRatioPrice * groupRatio
          })}</p>
          <p>{i18next.t('Complete：${{price}} * {{ratio}} = ${{total}} / 1M tokens', {
            price: completionRatioPrice,
            ratio: groupRatio,
            total: completionRatioPrice * groupRatio
          })}</p>
          <p>{i18next.t('AudioPrompt：${{price}} * {{ratio}} * {{audioRatio}} = ${{total}} / 1M tokens', {
            price: inputRatioPrice,
            ratio: groupRatio,
            audioRatio,
            total: inputRatioPrice * audioRatio * groupRatio
          })}</p>
          <p>{i18next.t('AudioComplete：${{price}} * {{ratio}} * {{audioRatio}} * {{audioCompRatio}} = ${{total}} / 1M tokens', {
            price: inputRatioPrice,
            ratio: groupRatio,
            audioRatio,
            audioCompRatio: audioCompletionRatio,
            total: inputRatioPrice * audioRatio * audioCompletionRatio * groupRatio
          })}</p>
          <p>
            {i18next.t('TextPrompt {{input}} tokens / 1M tokens * ${{price}} + TextComplete {{completion}} tokens / 1M tokens * ${{compPrice}} +', {
              input: inputTokens,
              price: inputRatioPrice,
              completion: completionTokens,
              compPrice: completionRatioPrice
            })}
          </p>
          <p>
            {i18next.t('AudioPrompt {{input}} tokens / 1M tokens * ${{price}} * {{audioRatio}} + AudioComplete {{completion}} tokens / 1M tokens * ${{price}} * {{audioRatio}} * {{audioCompRatio}}', {
              input: audioInputTokens,
              completion: audioCompletionTokens,
              price: inputRatioPrice,
              audioRatio,
              audioCompRatio: audioCompletionRatio
            })}
          </p>
          <p>
            {i18next.t('（Text + Audio）* GroupMultiplier {{ratio}} = ${{total}}', {
              ratio: groupRatio,
              total: price.toFixed(6)
            })}
          </p>
          <p>{i18next.t('For reference only，UsedActualButtonCostForAccurate')}</p>
        </article>
      </>
    );
  }
}

export function renderQuotaWithPrompt(quota, digits) {
  let displayInCurrency = localStorage.getItem('display_in_currency');
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return '|' + i18next.t('Equivalent amount') + ': ' + renderQuota(quota, digits) + '';
  }
  return '';
}

const colors = [
  'amber',
  'blue',
  'cyan',
  'green',
  'grey',
  'indigo',
  'light-blue',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'violet',
  'yellow'
];

// Basic10Color palette (N ≤ 10)
const baseColors = [
  '#1664FF', // Primary color
  '#1AC6FF',
  '#FF8A00',
  '#3CC780',
  '#7442D4',
  '#FFC400',
  '#304D77',
  '#B48DEB',
  '#009488',
  '#FF7DDA'
];

// Extension20Color palette (10 < N ≤ 20)
const extendedColors = [
  '#1664FF',
  '#B2CFFF',
  '#1AC6FF',
  '#94EFFF',
  '#FF8A00',
  '#FFCE7A',
  '#3CC780',
  '#B9EDCD',
  '#7442D4',
  '#DDC5FA',
  '#FFC400',
  '#FAE878',
  '#304D77',
  '#8B959E',
  '#B48DEB',
  '#EFE3FF',
  '#009488',
  '#59BAA8',
  '#FF7DDA',
  '#FFCFEE'
];

export const modelColorMap = {
  'dall-e': 'rgb(147,112,219)', // Deep purple
  // 'dall-e-2': 'rgb(147,112,219)', // IntroduceLess thanPurpleAndAnd blueTheColorAdjust
  'dall-e-3': 'rgb(153,50,204)', // IntroduceLess thanVioletAndAnd magentaTheColorAdjust
  'gpt-3.5-turbo': 'rgb(184,227,167)', // Light green
  // 'gpt-3.5-turbo-0301': 'rgb(131,220,131)', // Bright green
  'gpt-3.5-turbo-0613': 'rgb(60,179,113)', // Sea green
  'gpt-3.5-turbo-1106': 'rgb(32,178,170)', // LightSea green
  'gpt-3.5-turbo-16k': 'rgb(149,252,206)', // Pale orange
  'gpt-3.5-turbo-16k-0613': 'rgb(119,255,214)', // Pale peach
  'gpt-3.5-turbo-instruct': 'rgb(175,238,238)', // Powder blue
  'gpt-4': 'rgb(135,206,235)', // Sky blue
  // 'gpt-4-0314': 'rgb(70,130,180)', // Steel blue
  'gpt-4-0613': 'rgb(100,149,237)', // Cornflower blue
  'gpt-4-1106-preview': 'rgb(30,144,255)', // Dodger blue
  'gpt-4-0125-preview': 'rgb(2,177,236)', // Deep sky blue
  'gpt-4-turbo-preview': 'rgb(2,177,255)', // Deep sky blue
  'gpt-4-32k': 'rgb(104,111,238)', // Medium purple
  // 'gpt-4-32k-0314': 'rgb(90,105,205)', // Dark grayish blue
  'gpt-4-32k-0613': 'rgb(61,71,139)', // Dark bluish gray
  'gpt-4-all': 'rgb(65,105,225)', // Royal blue
  'gpt-4-gizmo-*': 'rgb(0,0,255)', // Pure blue
  'gpt-4-vision-preview': 'rgb(25,25,112)', // Midnight blue
  'text-ada-001': 'rgb(255,192,203)', // Pink
  'text-babbage-001': 'rgb(255,160,122)', // Light coral
  'text-curie-001': 'rgb(219,112,147)', // Pale violet
  // 'text-davinci-002': 'rgb(199,21,133)', // Medium violet-red
  'text-davinci-003': 'rgb(219,112,147)', // Pale violet（AndCurieThe same，Indicates sameOneItemsSeries）
  'text-davinci-edit-001': 'rgb(255,105,180)', // Hot pink
  'text-embedding-ada-002': 'rgb(255,182,193)', // Light pink
  'text-embedding-v1': 'rgb(255,174,185)', // LightPink（Slightly different）
  'text-moderation-latest': 'rgb(255,130,171)', // StrongPink
  'text-moderation-stable': 'rgb(255,160,122)', // Light coral（AndBabbageThe same，Indicates the same type of function）
  'tts-1': 'rgb(255,140,0)', // Dark orange
  'tts-1-1106': 'rgb(255,165,0)', // Orange
  'tts-1-hd': 'rgb(255,215,0)', // Gold
  'tts-1-hd-1106': 'rgb(255,223,0)', // Golden yellow（Slightly different）
  'whisper-1': 'rgb(245,245,220)', // Beige
  'claude-3-opus-20240229': 'rgb(255,132,31)', // Orange-red
  'claude-3-sonnet-20240229': 'rgb(253,135,93)', // Orange
  'claude-3-haiku-20240307': 'rgb(255,175,146)', // LightOrange
  'claude-2.1': 'rgb(255,209,190)', // LightOrange（Slightly different）
};

export function modelToColor(modelName) {
  // 1. IfModelHandle filtering and pagination logic first.PreDefinitionThe modelColorMap Use predefined colors，UseUsePreDefinitionColor
  if (modelColorMap[modelName]) {
    return modelColorMap[modelName];
  }

  // 2. GenerateOneItemsStableTheNumberWordOperateForIndex
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    hash = ((hash << 5) - hash) + modelName.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  hash = Math.abs(hash);

  // 3. UseModelNameLengthSelectNotSameTheColor swatch
  const colorPalette = modelName.length > 10 ? extendedColors : baseColors;
  
  // 4. UseUsehashAllSelectColor
  const index = hash % colorPalette.length;
  return colorPalette[index];
}

export function stringToColor(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  let i = sum % colors.length;
  return colors[i];
}
