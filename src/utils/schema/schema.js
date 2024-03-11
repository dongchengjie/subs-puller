import Ajv from 'ajv';
import AjvErrors from 'ajv-errors';
import AjvFormats from 'ajv-formats';
/**
 *
 * @param {string | JSON} schema schema配置
 * @param {string | JSON} content 校验内容
 * @param {Function} onError 检验出错回调
 * @returns {boolean} 是否满足schema
 */
export const validateSchema = (schema, content, onError) => {
  schema = typeof schema !== 'object' ? JSON.parse(schema.toString()) : schema;
  content = typeof content !== 'object' ? JSON.parse(content.toString()) : content;
  // 创建校验器
  const ajv = new Ajv({ allErrors: true });
  AjvFormats(ajv);
  AjvErrors(ajv);

  // 校验
  const validate = ajv.compile(schema);
  if (validate(content)) {
    return true;
  } else {
    onError && onError(validate.errors);
    return false;
  }
};
