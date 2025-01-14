// ModelSettingsVisualEditor.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, Form, Space } from '@douyinfe/semi-ui';
import { IconDelete, IconPlus, IconSearch, IconSave } from '@douyinfe/semi-icons';
import { showError, showSuccess } from '../../../helpers';
import { API } from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function ModelSettingsVisualEditor(props) {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    try {
      const modelPrice = JSON.parse(props.options.ModelPrice || '{}');
      const modelRatio = JSON.parse(props.options.ModelRatio || '{}');
      const completionRatio = JSON.parse(props.options.CompletionRatio || '{}');

      // MergeAre overwrite operationsModelName
      const modelNames = new Set([
        ...Object.keys(modelPrice),
        ...Object.keys(modelRatio),
        ...Object.keys(completionRatio)
      ]);

      const modelData = Array.from(modelNames).map(name => ({
        name,
        price: modelPrice[name] === undefined ? '' : modelPrice[name],
        ratio: modelRatio[name] === undefined ? '' : modelRatio[name],
        completionRatio: completionRatio[name] === undefined ? '' : completionRatio[name]
      }));

      setModels(modelData);
    } catch (error) {
      console.error('JSONFirst declare the tool functions related to pagination.Error:', error);
    }
  }, [props.options]);

  // First declarePaginationRelatedTheToolsFunction
  const getPagedData = (data, currentPage, pageSize) => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  };

  // Handle filtering and pagination logic first. return Then calculate pagination data based on the filtered data.，FirstPlaceRational filteringAndPagination logic
  const filteredModels = models.filter(model =>
    searchText ? model.name.toLowerCase().includes(searchText.toLowerCase()) : true
  );

  // HoweverAfterThis project is licensed underFilterAfterTheNumberDataCalculatePaginationNumberData
  const pagedData = getPagedData(filteredModels, currentPage, pageSize);

  const SubmitData = async () => {
    setLoading(true);
    const output = {
      ModelPrice: {},
      ModelRatio: {},
      CompletionRatio: {}
    };
    let currentConvertModelName = '';

    try {
      // NumberDataConvert
      models.forEach(model => {
        currentConvertModelName = model.name;
        if (model.price !== '') {
          // IfPriceNotForEmpty，ThenConvertForFloatPointNumber，IgnoreMultiplierParameterNumber
          output.ModelPrice[model.name] = parseFloat(model.price)
        } else {
          if (model.ratio !== '') output.ModelRatio[model.name] = parseFloat(model.ratio);
          if (model.completionRatio !== '') output.CompletionRatio[model.name] = parseFloat(model.completionRatio);
        }
      });

      // PrepareAPIPleaseRequestNumberGroup
      const finalOutput = {
        ModelPrice: JSON.stringify(output.ModelPrice, null, 2),
        ModelRatio: JSON.stringify(output.ModelRatio, null, 2),
        CompletionRatio: JSON.stringify(output.CompletionRatio, null, 2)
      };

      const requestQueue = Object.entries(finalOutput).map(([key, value]) => {
        return API.put('/api/option/', {
          key,
          value
        });
      });

      // AllowedPlaceReasonPleaseRequest
      const results = await Promise.all(requestQueue);

      // Allow through WeChatResult
      if (requestQueue.length === 1) {
        if (results.includes(undefined)) return;
      } else if (requestQueue.length > 1) {
        if (results.includes(undefined)) {
          return showError('Part.SaveFailed，PleaseRetry');
        }
      }

      // If it already existsEachItemsPleaseRequestTheResult
      for (const res of results) {
        if (!res.data.success) {
          return showError(res.data.message);
        }
      }

      showSuccess('SaveSuccess');
      props.refresh();

    } catch (error) {
      console.error('SaveFailed:', error);
      showError('SaveFailed，PleaseRetry');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('ModelName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('ModelSolid.PricingStrict.'),
      dataIndex: 'price',
      key: 'price',
      render: (text, record) => (
        <Input
          value={text}
          placeholder={t('Pay-as-you-go')}
          onChange={value => updateModel(record.name, 'price', value)}
        />
      )
    },
    {
      title: t('ModelMultiplier'),
      dataIndex: 'ratio',
      key: 'ratio',
      render: (text, record) => (
        <Input
          value={text}
          placeholder={record.price !== '' ? t('ModelMultiplier') : t('DefaultCompleteMultiplier')}
          disabled={record.price !== ''}
          onChange={value => updateModel(record.name, 'ratio', value)}
        />
      )
    },
    {
      title: t('CompleteMultiplier'),
      dataIndex: 'completionRatio',
      key: 'completionRatio',
      render: (text, record) => (
        <Input
          value={text}
          placeholder={record.price !== '' ? t('CompleteMultiplier') : t('DefaultCompleteMultiplier')}
          disabled={record.price !== ''}
          onChange={value => updateModel(record.name, 'completionRatio', value)}
        />
      )
    },
    {
      title: t('Operation'),
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<IconDelete />}
          type="danger"
          onClick={() => deleteModel(record.name)}
        />
      )
    }
  ];

  const updateModel = (name, field, value) => {
    if (isNaN(value)) {
      showError('Please enterNumberWord');
      return;
    }
    setModels(prev =>
      prev.map(model =>
        model.name === name
          ? { ...model, [field]: value }
          : model
      )
    );
  };

  const deleteModel = (name) => {
    setModels(prev => prev.filter(model => model.name !== name));
  };
  const addModel = (values) => {
    // If it already existsModelNameIsNoExistence, IfExistenceThenRejectAdd
    if (models.some(model => model.name === values.name)) {
      showError('ModelNameAlreadyExistence');
      return;
    }
    setModels(prev => [{
      name: values.name,
      price: values.price || '',
      ratio: values.ratio || '',
      completionRatio: values.completionRatio || ''
    }, ...prev]);
    setVisible(false);
    showSuccess('AddSuccess');
  };


  return (
    <>
      <Space vertical align="start" style={{ width: '100%' }}>
        <Space>
          <Button icon={<IconPlus />} onClick={() => setVisible(true)}>
            {t('AddModel')}
          </Button>
          <Button type="primary" icon={<IconSave />} onClick={SubmitData}>
            {t('ShouldUseChange')}
          </Button>
          <Input
            prefix={<IconSearch />}
            placeholder={t('SearchModelName')}
            value={searchText}
            onChange={value => {
              setSearchText(value)
              setCurrentPage(1);
            }}
            style={{ width: 200 }}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={pagedData}
          pagination={{
            currentPage: currentPage,
            pageSize: pageSize,
            total: filteredModels.length,
            onPageChange: page => setCurrentPage(page),
            formatPageText: (page) =>
              t('The {{start}} - {{end}} Item，Total {{total}} Item', {
                start: page.currentStart,
                end: page.currentEnd,
                total: filteredModels.length
              }),
            showTotal: true,
            showSizeChanger: false
          }}
        />
      </Space>

      <Modal
        title={t('AddModel')}
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={() => {
          currentModel && addModel(currentModel);
        }}
      >
        <Form>
          <Form.Input
            field="name"
            label={t('ModelName')}
            placeholder="strawberry"
            required
            onChange={value => setCurrentModel(prev => ({ ...prev, name: value }))}
          />
          <Form.Switch
            field="priceMode"
            label={<>{t('PricingMode')}：{currentModel?.priceMode ? t("Solid.PricingStrict.") : t("MultiplierMode")}</>}
            onChange={checked => {
              setCurrentModel(prev => ({
                ...prev,
                price: '',
                ratio: '',
                completionRatio: '',
                priceMode: checked
              }));
            }}
          />
          {currentModel?.priceMode ? (
            <Form.Input
              field="price"
              label={t('Solid.PricingStrict.(Each time)')}
              placeholder={t('InputEach timePrice')}
              onChange={value => setCurrentModel(prev => ({ ...prev, price: value }))}
            />
          ) : (
            <>
              <Form.Input
                field="ratio"
                label={t('ModelMultiplier')}
                placeholder={t('InputModelMultiplier')}
                onChange={value => setCurrentModel(prev => ({ ...prev, ratio: value }))}
              />
              <Form.Input
                field="completionRatio"
                label={t('CompleteMultiplier')}
                placeholder={t('InputCompletePrice')}
                onChange={value => setCurrentModel(prev => ({ ...prev, completionRatio: value }))}
              />
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}
