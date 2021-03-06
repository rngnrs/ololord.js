import $ from 'jquery';

import * as AJAX from '../helpers/ajax';
import * as Constants from '../helpers/constants';
import * as DOM from '../helpers/dom';
import * as Tools from '../helpers/tools';
import PopupMessage from '../widgets/popup-message';

const ID = 'node-captcha';
const WIDGET_TEMPLATE = 'captcha/nodeCaptchaWidget';

let countdownTimer = null;

async function reload() {
  let captcha = DOM.id('captcha');
  if (!captcha) {
    return;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  let image = $(DOM.nameOne('image', captcha));
  let challenge = DOM.nameOne('nodeCaptchaChallenge', captcha);
  let response = DOM.nameOne('nodeCaptchaResponse', captcha);
  if (!challenge || !response) {
    return PopupMessage.showPopup(Tools.translate('No challenge/response'), { type: 'critical' });
  }
  let countdown = $(DOM.nameOne('countdown', captcha));
  response.value = '';
  countdown.empty();
  image.empty();
  let createImage = (src, title) => {
    let img = $(`<img src='/${Tools.sitePathPrefix()}${src}' title='${title || ''}' style='cursor: pointer;' />`);
    img.click(reload.bind(null, captcha));
    return img;
  };
  try {
    let model = await AJAX.api('nodeCaptchaImage', {});
    challenge.value = model.challenge;
    image.append(createImage(`node-captcha/${model.fileName}`));
    setTimeout(reload.bind(null, captcha), model.ttl);
    let seconds = model.ttl / Constants.SECOND;
    countdown.text(Tools.formatTime(seconds));
    countdownTimer = setInterval(() => {
      --seconds;
      countdown.empty().text(Tools.formatTime(seconds));
    }, Constants.SECOND);
  } catch (err) {
    image.append(createImage('img/node-captcha-fail.png', err));
    DOM.handleError(err);
  }
}

export default {
  id: ID,
  widgetTemplate: WIDGET_TEMPLATE,
  reload: reload,
  initialize: reload
};
